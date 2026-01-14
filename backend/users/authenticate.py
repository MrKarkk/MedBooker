"""
Кастомная аутентификация JWT с поддержкой http-only cookies
"""
from rest_framework_simplejwt import authentication as jwt_authentication
from django.conf import settings
from rest_framework import authentication, exceptions as rest_exceptions


def enforce_csrf(request):
    """
    Проверка CSRF токена для защиты от CSRF атак
    """
    check = authentication.CSRFCheck(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise rest_exceptions.PermissionDenied(f'CSRF Failed: {reason}')


class CustomAuthentication(jwt_authentication.JWTAuthentication):
    """
    Кастомная аутентификация, которая читает JWT токен из:
    1. HTTP-only cookies (приоритет)
    2. Authorization header (fallback)
    
    И проверяет CSRF токен для дополнительной безопасности
    """
    
    def authenticate(self, request):
        header = self.get_header(request)
        
        # Пытаемся получить токен из http-only cookie
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE')) or None
        
        if header is None:
            # Если нет header'а и есть cookie - используем cookie
            if raw_token is None:
                return None
        else:
            # Если есть header - используем его (для обратной совместимости)
            raw_token = self.get_raw_token(header)
        
        if raw_token is None:
            return None
        
        validated_token = self.get_validated_token(raw_token)
        
        # ВАЖНО: Проверяем CSRF только для запросов с изменением данных
        # Исключаем login/register endpoints, так как они публичные и не имеют CSRF токена
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Проверяем что это не login/register endpoints
            if not any(endpoint in request.path for endpoint in ['/login/', '/register/']):
                enforce_csrf(request)
        
        return self.get_user(validated_token), validated_token
