import hashlib
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.middleware import csrf
from django.utils import timezone
from rest_framework import status
from rest_framework import serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt import serializers as jwt_serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken

from .authenticate import enforce_csrf
from .models import RefreshToken
from .serializers import *


def is_super_admin(user):
    """Проверка, является ли пользователь супер-администратором"""
    return user.is_authenticated and user.role == 'super_admin'


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


class CookieTokenRefreshSerializer(jwt_serializers.TokenRefreshSerializer):
    refresh = drf_serializers.CharField(required=False)

    def validate(self, attrs):
        refresh_cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH']
        refresh_from_cookie = self.context['request'].COOKIES.get(refresh_cookie_name)
        if not refresh_from_cookie:
            raise TokenError('Refresh token не найден')

        attrs['refresh'] = refresh_from_cookie
        return super().validate(attrs)


REMEMBER_ME_REFRESH_LIFETIME = timedelta(days=30)


def get_tokens_for_user(user, refresh_lifetime=None):
    """Генерация Access и Refresh токенов для пользователя"""
    RefreshToken.objects.filter(user=user).delete()  # Удаляем старые токены
    refresh = JWTRefreshToken.for_user(user)
    access = refresh.access_token
    
    # Сохраняем refresh token в БД
    if refresh_lifetime is None:
        refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=1))
    expires_at = timezone.now() + refresh_lifetime
    RefreshToken.objects.create(
        user=user,
        token=hash_token(str(refresh)),
        jti=refresh['jti'],
        expires_at=expires_at
    )
    
    return {
        'refresh': str(refresh),
        'access': str(access),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Регистрация нового пользователя с установкой токенов в http-only cookies
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        
        response_data = {
            'user': UserSerializer(user).data,
            'message': 'Регистрация успешна'
        }
        
        res = Response(response_data, status=status.HTTP_201_CREATED)
        
        # Устанавливаем access token в http-only cookie
        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=tokens['access'],
            max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )
        
        # Устанавливаем refresh token в http-only cookie
        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
            value=tokens['refresh'],
            max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )
        
        # Добавляем CSRF токен в header
        res['X-CSRFToken'] = csrf.get_token(request)
        
        return res
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Авторизация пользователя с установкой токенов в http-only cookies
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    remember_me = bool(request.data.get('remember_me', False))
    
    # Аутентифицируем пользователя
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return Response({
            'error': 'Неверный email или пароль'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'error': 'Аккаунт деактивирован'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Генерируем токены с учётом флага «Запомнить меня»
    refresh_lifetime = REMEMBER_ME_REFRESH_LIFETIME if remember_me else settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=1))
    tokens = get_tokens_for_user(user, refresh_lifetime=refresh_lifetime)
    
    # Создаем response
    response_data = {
        'user': UserSerializer(user).data,
        'message': 'Авторизация успешна'
    }
    
    res = Response(response_data, status=status.HTTP_200_OK)
    
    # Устанавливаем access token в http-only cookie (всегда с фиксированным временем жизни)
    res.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE'],
        value=tokens['access'],
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
    )
    
    # Устанавливаем refresh token в http-only cookie
    # remember_me=True  → persistent cookie на 30 дней
    # remember_me=False → session cookie (исчезает при закрытии браузера)
    refresh_cookie_kwargs = dict(
        key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
        value=tokens['refresh'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
    )
    if remember_me:
        refresh_cookie_kwargs['max_age'] = int(refresh_lifetime.total_seconds())
    res.set_cookie(**refresh_cookie_kwargs)
    
    # Добавляем CSRF токен в header
    res['X-CSRFToken'] = csrf.get_token(request)
    
    return res


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Выход пользователя (инвалидация токенов и удаление cookies)
    """
    enforce_csrf(request)

    # Получаем refresh token из cookie
    refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
    refresh_token_hash = hash_token(refresh_token) if refresh_token else None

    if refresh_token:
        try:
            # Добавляем в blacklist
            token = JWTRefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Игнорируем ошибки, если токен уже недействителен

        # Инвалидируем токен в БД
        RefreshToken.objects.filter(token=refresh_token_hash).update(is_revoked=True)

    response = Response({'message': 'Выход выполнен успешно'}, status=status.HTTP_200_OK)
    
    # Удаляем все auth cookies
    response.delete_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE'],
        path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
    )
    response.delete_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
        path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
    )
    response.delete_cookie('csrftoken', path='/')
    response['X-CSRFToken'] = None
    
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    """
    Обновление Access Token используя Refresh Token из http-only cookie
    """
    refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])

    if not refresh_token:
        return Response({
            'error': 'Refresh token не найден'
        }, status=status.HTTP_401_UNAUTHORIZED)

    refresh_token_hash = hash_token(refresh_token)
    stored_refresh = RefreshToken.objects.filter(
        token=refresh_token_hash,
        is_revoked=False,
        expires_at__gt=timezone.now()
    ).first()

    if not stored_refresh:
        return Response({
            'error': 'Refresh token недействителен'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        enforce_csrf(request)

        serializer = CookieTokenRefreshSerializer(data={}, context={'request': request})
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data['access']
        new_refresh_token = serializer.validated_data.get('refresh')

        response = Response({'message': 'Токен обновлен'}, status=status.HTTP_200_OK)

        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=access_token,
            max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )

        if new_refresh_token:
            with transaction.atomic():
                stored_refresh.is_revoked = True
                stored_refresh.save(update_fields=['is_revoked'])

                new_refresh_jti = JWTRefreshToken(new_refresh_token)['jti']
                refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME')
                expires_at = timezone.now() + refresh_lifetime

                RefreshToken.objects.create(
                    user=stored_refresh.user,
                    token=hash_token(new_refresh_token),
                    jti=new_refresh_jti,
                    expires_at=expires_at,
                    is_revoked=False,
                )

            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=new_refresh_token,
                max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
            )
        else:
            stored_refresh.is_revoked = True
            stored_refresh.save(update_fields=['is_revoked'])

        # Добавляем CSRF токен
        response['X-CSRFToken'] = request.COOKIES.get('csrftoken')

        return response

    except TokenError:
        return Response({
            'error': 'Неверный или истекший refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    return Response({'csrfToken': csrf.get_token(request)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Получение информации о текущем пользователе
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Обновление профиля пользователя
    """
    serializer = UpdateProfileSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH',
        context={'request': request}
    )
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Профиль успешно обновлен',
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Смена пароля пользователя
    """
    serializer = ChangePasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        user = request.user
        
        # Проверка старого пароля
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'Неверный старый пароль'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Установка нового пароля
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Пароль успешно изменен'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
