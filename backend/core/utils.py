import os
import logging
import requests
import base64
import asyncio
from datetime import datetime
from django.conf import settings
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework import status
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from aiogram.filters import Command


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
        # RFC 5987 кодировка для корректной передачи не-ASCII имён файлов
        from urllib.parse import quote
        encoded_name = quote(download_name, safe='')
        response['Content-Disposition'] = (
            f"attachment; filename*=UTF-8''{encoded_name}"
        )
        logger.info(f"Файл {file_name} успешно загружен и отправлен клиенту")
        return response
    except Exception as e:
        logger.exception("Ошибка при загрузке файла %s", file_name)
        return Response(
            {'error': f'Ошибка при загрузке файла: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def send_telegram_notification(full_name: str, email: str, message: str) -> bool:
    """
    Отправляет уведомление о новом сообщении с контактной формы в Telegram-чат администратора.
    Токен и chat_id берутся из переменных окружения TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_CHAT_ID.
    """
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = getattr(settings, 'TELEGRAM_ADMIN_CHAT_ID', None)

    if not bot_token or not chat_id:
        logger.warning("TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_CHAT_ID не настроены — уведомление не отправлено")
        return False

    text = (
        "📩 <b>Новое сообщение с сайта</b>\n\n"
        f"👤 <b>ФИО:</b> {full_name}\n"
        f"📧 <b>Email:</b> {email}\n\n"
        f"💬 <b>Сообщение:</b>\n{message}"
    )

    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        response = requests.post(
            url,
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
        response.raise_for_status()
        logger.info("Telegram-уведомление отправлено для %s", email)
        return True
    except Exception as exc:
        logger.error("Ошибка отправки Telegram-уведомления: %s", exc)
        return False


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
        api_key = getattr(settings, 'SPEECHKIT_API_KEY_V3')
        folder_id = getattr(settings, 'SPEECHKIT_FOLDER_ID_V3')

        if not api_key:
            logger.warning("SPEECHKIT_API_KEY_V3 не настроен в settings")
            return None
        if not folder_id:
            logger.warning("SPEECHKIT_FOLDER_ID_V3 не настроен в settings")
            return None
        
        headers = {
            "Authorization": f"Api-Key {api_key}",
            "x-folder-id": f"{folder_id}",
        }

        # Форматируем номер талона для произношения (если талон есть)
        number_coupon_res = ''
        if number_coupon:
            number_coupon1 = number_coupon[:1] if len(number_coupon) >= 1 else ''
            number_coupon2 = number_coupon[1:] if len(number_coupon) > 1 else ''
            number_coupon_res = f'{number_coupon1} sil<[1]>{number_coupon2}'

        if not cabinet_number:
            text = f"Пациент с талоном номер {number_coupon_res}, пожалуйста подойдите к врачу."
        else:
            text = f"Пациент с талоном номер {number_coupon_res}, пожалуйста подойдите в кабинет {cabinet_number}."

        data = {
            "text": text,
            "hints": [
                { "voice": "lera" },
                { "role": "neutral" },
                { "speed": 0.9 }
            ]
        }

        logger.info(f"[SPEECH] Синтез речи в памяти: {text}")

        response = requests.post(
            settings.SPEECHKIT_URL_V3,
            headers=headers,
            json=data,
            timeout=5
        )

        if response.status_code == 200:
            # v3 API возвращает JSON-стрим: каждая строка — JSON с audioChunk.data (base64)
            import json as _json
            audio_chunks = []
            for line in response.content.decode('utf-8').strip().split('\n'):
                line = line.strip()
                if not line:
                    continue
                try:
                    chunk = _json.loads(line)
                    b64 = chunk.get('result', {}).get('audioChunk', {}).get('data', '')
                    if b64:
                        audio_chunks.append(base64.b64decode(b64))
                except Exception:
                    continue
            if not audio_chunks:
                logger.error("[ERROR] Не удалось извлечь аудио-чанки из ответа SpeechKit")
                return None
            combined = b''.join(audio_chunks)
            audio_base64 = base64.b64encode(combined).decode('utf-8')
            logger.info(f"[OK] Аудио синтезировано для {patient_name} (размер: {len(combined)} байт)")
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


def default_working_days():
    return {"mon": True, "tue": True, "wed": True, "thu": True, "fri": True, "sat": True, "sun": False}

def default_working_hours():
    return {"mon": ["09:00", "18:00"], "tue": ["09:00", "18:00"], "wed": ["09:00", "18:00"], "thu": ["09:00", "18:00"], "fri": ["09:00", "18:00"], "sat": ["10:00", "16:00"], "sun": []}

def default_lunch_time():
    return {"mon": ["13:00", "14:00"], "tue": ["13:00", "14:00"], "wed": ["13:00", "14:00"], "thu": ["13:00", "14:00"], "fri": ["13:00", "14:00"], "sat": ["12:00", "13:00"], "sun": []}


async def run_bot_async():
    """Запускает polling Telegram-бота. Вызывать через asyncio.run()."""
    from asgiref.sync import sync_to_async

    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN не настроен — Telegram не будут работать")
        return None

    bot = Bot(token=bot_token)
    dp = Dispatcher()

    # --------------- DB helpers ---------------

    @sync_to_async
    def get_doctor_by_tg(tg_id_str):
        from core.models import Doctor
        return Doctor.objects.filter(tg_id=tg_id_str).select_related('clinic').first()

    @sync_to_async
    def get_today_queue(doctor_id):
        from appointment.models import Appointment
        from datetime import date
        return list(
            Appointment.objects.filter(
                doctor_id=doctor_id,
                date=date.today(),
                status__in=['pending', 'confirmed', 'invited', 'urgent'],
            ).order_by('time_start')
        )

    @sync_to_async
    def get_appointment(appointment_id):
        from appointment.models import Appointment
        return Appointment.objects.filter(id=appointment_id).select_related('doctor').first()

    @sync_to_async
    def set_status(appointment_id, new_status):
        from appointment.models import Appointment
        return Appointment.objects.filter(id=appointment_id).update(status=new_status) > 0

    # --------------- UI helpers ---------------

    STATUS_EMOJI = {
        'pending':   '🔵',
        'confirmed': '🟡',
        'invited':   '🟢',
        'urgent':    '🔴',
    }

    def build_keyboard(appointments):
        rows = []
        for apt in appointments:
            coupon = apt.number_coupon or apt.time_start.strftime('%H:%M')
            name = (apt.patient_full_name or 'Пациент').split()[0]
            if apt.status in ('urgent',):
                rows.append([InlineKeyboardButton(
                    text=f"📢 Пригласить: {coupon} — {name}",
                    callback_data=f"invite:{apt.id}",
                )])
            elif apt.status == 'invited':
                rows.append([InlineKeyboardButton(
                    text=f"✅ Завершить: {coupon} — {name}",
                    callback_data=f"finish:{apt.id}",
                )])
        rows.append([InlineKeyboardButton(
            text="⏭ Следующий пациент",
            callback_data="next",
        )])
        rows.append([InlineKeyboardButton(
            text="🔄 Обновить очередь",
            callback_data="refresh",
        )])
        return InlineKeyboardMarkup(inline_keyboard=rows)

    def build_text(appointments, doctor_name):
        if not appointments:
            return f"{doctor_name}\n\n✅ Очередь на сегодня пуста."
        lines = [f"<b>{doctor_name}</b> — очередь на сегодня:\n"]
        for apt in appointments:
            coupon = apt.number_coupon or apt.time_start.strftime('%H:%M')
            emoji = STATUS_EMOJI.get(apt.status, '⚪')
            lines.append(f"{emoji} {coupon} — {apt.patient_full_name}")
        return '\n'.join(lines)

    async def send_queue(target, doctor):
        appointments = await get_today_queue(doctor.id)
        text = build_text(appointments, doctor.full_name)
        kb = build_keyboard(appointments)
        if isinstance(target, CallbackQuery):
            await target.message.edit_text(text, reply_markup=kb, parse_mode='HTML')
        else:
            await target.answer(text, reply_markup=kb, parse_mode='HTML')

    # --------------- Handlers ---------------

    @dp.message(Command('start'))
    async def cmd_start(message: Message):
        tg_id_str = str(message.from_user.id)
        doctor = await get_doctor_by_tg(tg_id_str)
        if doctor:
            await message.answer(
                f"✅ <b>Добро пожаловать, {doctor.full_name}!</b>\n"
                f"🏥 Клиника: {doctor.clinic.name}\n\n"
                f"Отправьте /queue чтобы увидеть очередь на сегодня.",
                parse_mode='HTML',
            )
        else:
            await message.answer(
                f"👋 Привет! Я бот платформы MEDBOOKER.\n\n"
                f"Ваш Telegram ID: <code>{tg_id_str}</code>\n"
                f"Попросите администратора привязать этот ID к аккаунту врача.",
                parse_mode='HTML',
            )

    @dp.message(Command('queue'))
    async def cmd_queue(message: Message):
        doctor = await get_doctor_by_tg(str(message.from_user.id))
        if not doctor:
            await message.answer("❌ Ваш Telegram не привязан к аккаунту врача.")
            return
        await send_queue(message, doctor)

    @dp.callback_query(F.data == 'refresh')
    async def cb_refresh(callback: CallbackQuery):
        doctor = await get_doctor_by_tg(str(callback.from_user.id))
        if not doctor:
            await callback.answer("❌ Доступ запрещён", show_alert=True)
            return
        await send_queue(callback, doctor)
        await callback.answer()

    @dp.callback_query(F.data == 'next')
    async def cb_next(callback: CallbackQuery):
        doctor = await get_doctor_by_tg(str(callback.from_user.id))
        if not doctor:
            await callback.answer("❌ Доступ запрещён", show_alert=True)
            return
        appointments = await get_today_queue(doctor.id)
        next_apt = next(
            (a for a in appointments if a.status in ('pending', 'confirmed')), None
        )
        if not next_apt:
            await callback.answer("Ожидающих пациентов нет", show_alert=True)
            return
        ok = await set_status(next_apt.id, 'invited')
        if ok:
            coupon = next_apt.number_coupon or next_apt.time_start.strftime('%H:%M')
            await callback.answer(f"✅ Приглашён: {coupon}")
            await send_queue(callback, doctor)
        else:
            await callback.answer("Ошибка обновления", show_alert=True)

    @dp.callback_query(F.data.startswith('invite:'))
    async def cb_invite(callback: CallbackQuery):
        doctor = await get_doctor_by_tg(str(callback.from_user.id))
        if not doctor:
            await callback.answer("❌ Доступ запрещён", show_alert=True)
            return
        apt_id = int(callback.data.split(':')[1])
        apt = await get_appointment(apt_id)
        if not apt or apt.doctor_id != doctor.id:
            await callback.answer("❌ Запись не найдена", show_alert=True)
            return
        ok = await set_status(apt_id, 'invited')
        if ok:
            coupon = apt.number_coupon or apt.time_start.strftime('%H:%M')
            await callback.answer(f"✅ Приглашён: {coupon}")
            await send_queue(callback, doctor)
        else:
            await callback.answer("Ошибка обновления", show_alert=True)

    @dp.callback_query(F.data.startswith('finish:'))
    async def cb_finish(callback: CallbackQuery):
        doctor = await get_doctor_by_tg(str(callback.from_user.id))
        if not doctor:
            await callback.answer("❌ Доступ запрещён", show_alert=True)
            return
        apt_id = int(callback.data.split(':')[1])
        apt = await get_appointment(apt_id)
        if not apt or apt.doctor_id != doctor.id:
            await callback.answer("❌ Запись не найдена", show_alert=True)
            return
        ok = await set_status(apt_id, 'finished')
        if ok:
            await callback.answer("✅ Приём завершён")
            await send_queue(callback, doctor)
        else:
            await callback.answer("Ошибка обновления", show_alert=True)

    # --------------- start polling ---------------

    logger.info("Telegram-бот запускается (polling)...")
    await dp.start_polling(bot, handle_signals=True)

