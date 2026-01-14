"""
Custom middleware для проекта Med-Booker
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('django.request')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware для логирования запросов и времени их выполнения
    """
    
    def process_request(self, request):
        """Сохраняем время начала обработки запроса"""
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Логируем время выполнения запроса"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Логируем только медленные запросы (> 1 секунды)
            if duration > 1.0:
                logger.warning(
                    f'Slow request: {request.method} {request.path} - '
                    f'{duration:.2f}s - Status: {response.status_code}'
                )
            elif duration > 0.5:
                logger.info(
                    f'Request: {request.method} {request.path} - '
                    f'{duration:.2f}s - Status: {response.status_code}'
                )
        
        return response
    
    def process_exception(self, request, exception):
        """Логируем исключения"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.error(
                f'Exception: {request.method} {request.path} - '
                f'{duration:.2f}s - {str(exception)}'
            )
        return None


class HealthCheckMiddleware(MiddlewareMixin):
    """
    Middleware для health check endpoints
    Пропускает логирование для health check'ов
    """
    
    def process_request(self, request):
        if request.path in ['/health/', '/api/health/', '/ping/']:
            request.is_health_check = True
        return None
