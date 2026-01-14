import logging

from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import *
from .serializers import *
from .utils import *
from .notifications import send_event_async


now = datetime.now()
tg_targets = getattr(settings, 'SUPERADMIN_TELEGRAM_ID', '')
if isinstance(tg_targets, str):
    tg_targets = [int(x) for x in tg_targets.split(',') if x.strip().isdigit()]
logger = logging.getLogger(__name__)


@api_view(['GET', 'HEAD'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint для Docker и мониторинга"""
    return Response({'status': 'healthy', 'service': 'backend'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def document_commercial_proposal_full(request):
    return serve_pdf_file(
        file_name='MedBooker(full).pdf',
        download_name='MedBooker_Полное_предложение.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_commercial_proposal_life(request):
    return serve_pdf_file(
        file_name='MedBooker(life).pdf',
        download_name='MedBooker_Краткое_предложение.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_terms_of_service(request):
    return serve_pdf_file(
        file_name='УСЛОВИЯ ИСПОЛЬЗОВАНИЯ (RU).pdf',
        download_name='Условия_использования_MedBooker.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_privacy_policy(request):
    return serve_pdf_file(
        file_name='ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ (RU).pdf',
        download_name='Политика_конфиденциальности_MedBooker.pdf'
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def received_message(request):
    """Получение сообщения от пользователя через форму обратной связи"""
    required_fields = ['full_name', 'email', 'message'] # Обязательные поля
    missing_fields = [field for field in required_fields if not request.data.get(field)]
    if missing_fields:
        return Response(
            {'error': f'Не заполнены обязательные поля: {", ".join(missing_fields)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ReceivedMessageSerializer(data=request.data)
    if serializer.is_valid():
        full_name = request.data.get('full_name') or ''
        email = request.data.get('email') or ''
        message_text = request.data.get('message') or ''

        send_event_async({
            "event": "received_message",
            "tg_id": tg_targets,
            "data": {
                "full_name": str(full_name),
                "email": str(email),
                "message": str(message_text),
            }
        })
        serializer.save()
        return Response({'message': 'Сообщение успешно получено'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_faq_entries(request):
    """Получение списка часто задаваемых вопросов (FAQ)"""
    faq_entries = FAQEntry.objects.all().order_by('id')
    serializer = FAQEntrySerializer(faq_entries, many=True)
    return Response({'faq_entries': serializer.data}, status=status.HTTP_200_OK)