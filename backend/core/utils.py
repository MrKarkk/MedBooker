import os
import logging
import requests
import base64
from datetime import datetime
from django.conf import settings
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework import status


logger = logging.getLogger(__name__)

def serve_pdf_file(
        file_name: str, 
        download_name: str | None = None, 
        folder: str = 'documents', 
        content_type: str = 'application/pdf'
        ):
    
    file_path = os.path.join(settings.BASE_DIR, folder, file_name)
    if not os.path.exists(file_path):
        return Response(
            {'error': 'Файл не найден'}, 
            status=status.HTTP_404_NOT_FOUND
            )

    try:
        file = open(file_path, 'rb')
        response = FileResponse(file, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{download_name}"'
        return response
    except Exception as e:
        logger.exception("Ошибка при загрузке файла %s", file_name)
        return Response(
            {'error': f'Ошибка при загрузке файла: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def user_verification(user, role_user, text_error):
    """Проверка верификации пользователя"""
    if not user.role == role_user:
        return Response(
            {'error': text_error},
            status=status.HTTP_403_FORBIDDEN
        )
    return True

def patient_call_synthesis_in_memory(patient_name, number_coupon, cabinet_number=""):
    """
    Синтез речи для вызова пациента через Yandex SpeechKit (возвращает аудио в памяти)
    """
    try:
        # Проверяем наличие API ключа
        api_key = getattr(settings, 'SPEECHKIT_API_KEY', None)
        if not api_key:
            logger.warning("SPEECHKIT_API_KEY не настроен в settings")
            return None
        
        headers = {
            "Authorization": f"Api-Key {api_key}",
        }
        
        # Форматируем номер талона для произношения (если талон есть)
        number_coupon_res = ''
        if number_coupon:
            number_coupon1 = number_coupon[:1] if len(number_coupon) >= 1 else ''
            number_coupon2 = number_coupon[1:] if len(number_coupon) > 1 else ''
            number_coupon_res = f'sil<[2]> {number_coupon1} sil<[3]> {number_coupon2}'

        if not number_coupon and not cabinet_number:
            text = f"Уважаемый {patient_name}! Пожалуйста подойдите к врачу."
        elif not number_coupon:
            text = f"Уважаемый {patient_name}! Пожалуйста подойдите в кабинет {cabinet_number}."
        elif cabinet_number:
            text = f"Уважаемый {patient_name}! Ваш талон номер {number_coupon_res}, при+ём в кабинете sil<[2]> {cabinet_number}."
        else:
            text = f"Уважаемый {patient_name}! Ваш талон номер {number_coupon_res}, пожалуйста подойдите к врачу."

        data = {
            "text": text,
            "lang": "ru-RU",
            "voice": "zahar",
            "speed": "0.9",
        }

        logger.info(f"[SPEECH] Синтез речи в памяти: {patient_name}, талон: {number_coupon}")

        response = requests.post(
            settings.SPEECHKIT_URL,
            headers=headers,
            data=data,
            timeout=10
        )

        if response.status_code == 200:
            # Кодируем аудио в base64
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            logger.info(f"[OK] Аудио синтезировано для {patient_name} (размер: {len(response.content)} байт)")
            return audio_base64
        else:
            error_msg = f"Ошибка синтеза речи: {response.status_code}"
            logger.error(f"[ERROR] {error_msg} - {response.text}")
            
            if response.status_code == 401:
                logger.error("[ERROR] Проверьте SPEECHKIT_API_KEY и права доступа в Yandex Cloud")
            
            return None
    except requests.exceptions.Timeout:
        logger.error("[ERROR] Таймаут при обращении к SpeechKit API")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"[ERROR] Сетевая ошибка при синтезе речи: {str(e)}")
        return None
    except Exception as e:
        logger.exception(f"[ERROR] Исключение при синтезе речи для {patient_name}: {str(e)}")
        return None