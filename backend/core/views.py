import logging

from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import *
from .serializers import *
from .utils import *


logger = logging.getLogger(__name__)


@api_view(['GET', 'HEAD'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint для Docker и мониторинга"""
    logger.debug(f"Проверка здоровья запрошена {datetime.now()}")
    return Response({'status': 'healthy', 'service': 'backend'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def document_commercial_proposal_full(request):
    logger.debug(f"Запрос на получение полного коммерческого предложения {datetime.now()}")
    return serve_pdf_file(
        file_name='MedBooker(full).pdf',
        download_name='MedBooker_Полное_предложение.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_commercial_proposal_life(request):
    logger.debug(f"Запрос на получение коммерческого предложения для жизни {datetime.now()}")
    return serve_pdf_file(
        file_name='MedBooker(life).pdf',
        download_name='MedBooker_Краткое_предложение.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_terms_of_service(request):
    logger.debug(f"Запрос на получение условий использования {datetime.now()}")
    return serve_pdf_file(
        file_name='УСЛОВИЯ ИСПОЛЬЗОВАНИЯ (RU).pdf',
        download_name='Условия_использования_MedBooker.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_privacy_policy(request):
    logger.debug(f"Запрос на получение политики конфиденциальности {datetime.now()}")
    return serve_pdf_file(
        file_name='ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ (RU).pdf',
        download_name='Политика_конфиденциальности_MedBooker.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_faq_entries(request):
    logger.debug(f"Запрос на получение списка FAQ {datetime.now()}")
    """Получение списка часто задаваемых вопросов (FAQ)"""
    faq_entries = FAQEntry.objects.all().order_by('id')
    serializer = FAQEntrySerializer(faq_entries, many=True)
    logger.debug(f"Найдено {len(serializer.data)} FAQ записей")
    return Response({'faq_entries': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def received_message(request):
    serializer = ReceivedMessageSerializer(data=request.data)
    if serializer.is_valid():
        instance = serializer.save()
        logger.info(f"Сохранено новое сообщение от {instance.full_name}")
        send_telegram_notification(
            full_name=instance.full_name,
            email=instance.email,
            message=instance.message,
        )
        return Response({'message': 'Сообщение успешно отправлено'}, status=status.HTTP_201_CREATED)
    logger.warning(f"Ошибка валидации сообщения: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


FRONTEND_LOG_LEVELS = {'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'}

@api_view(['POST'])
@permission_classes([AllowAny])
def frontend_log(request):
    """Приём лога с фронтенда и запись в react.log.

    Ожидаемое тело запроса (JSON):
    {
        "level":   "INFO",             # уровень лога
        "message": "Текст сообщения",  # текст
        "page":    "/appointment/",    # текущий URL страницы
        "extra":   {}                  # произвольные дополнительные данные (необязательно)
    }
    """
    frontend_logger = logging.getLogger('frontend')

    level   = str(request.data.get('level',   'INFO')).upper()
    message = str(request.data.get('message', '')).strip()
    page    = str(request.data.get('page',    '—')).strip()
    extra   = request.data.get('extra', {})

    if level not in FRONTEND_LOG_LEVELS:
        level = 'INFO'

    if not message:
        return Response({'error': 'message обязателен'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    user_label = f"{user.email} (id={user.pk})" if user and user.is_authenticated else 'гость'

    log_line = f"[REACT] [{page}] [{user_label}] {message}"
    if extra:
        log_line += f" | extra={extra}"

    log_func = getattr(frontend_logger, level.lower(), frontend_logger.info)
    log_func(log_line)

    return Response({'ok': True}, status=status.HTTP_200_OK)