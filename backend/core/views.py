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
    logger.debug(f"Проверка здоровья запрошена по адресу {datetime.now()}")
    return Response({'status': 'healthy', 'service': 'backend'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def document_commercial_proposal_full(request):
    logger.debug(f"Запрос на получение полного коммерческого предложения по адресу {datetime.now()}")
    return serve_pdf_file(
        file_name='MedBooker(full).pdf',
        download_name='MedBooker_Полное_предложение.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_commercial_proposal_life(request):
    logger.debug(f"Запрос на получение коммерческого предложения для жизни по адресу {datetime.now()}")
    return serve_pdf_file(
        file_name='MedBooker(life).pdf',
        download_name='MedBooker_Краткое_предложение.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_terms_of_service(request):
    logger.debug(f"Запрос на получение условий использования по адресу {datetime.now()}")
    return serve_pdf_file(
        file_name='УСЛОВИЯ ИСПОЛЬЗОВАНИЯ (RU).pdf',
        download_name='Условия_использования_MedBooker.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def document_privacy_policy(request):
    logger.debug(f"Запрос на получение политики конфиденциальности по адресу {datetime.now()}")
    return serve_pdf_file(
        file_name='ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ (RU).pdf',
        download_name='Политика_конфиденциальности_MedBooker.pdf'
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_faq_entries(request):
    logger.debug(f"Запрос на получение списка FAQ по адресу {datetime.now()}")
    """Получение списка часто задаваемых вопросов (FAQ)"""
    faq_entries = FAQEntry.objects.all().order_by('id')
    serializer = FAQEntrySerializer(faq_entries, many=True)
    logger.debug(f"Найдено {len(serializer.data)} FAQ записей")
    return Response({'faq_entries': serializer.data}, status=status.HTTP_200_OK)