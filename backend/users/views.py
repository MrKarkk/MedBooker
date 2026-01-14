from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt import serializers as jwt_serializers, exceptions as jwt_exceptions
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.middleware import csrf
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta, datetime
from django.conf import settings
from core.notifications import send_event_async
from .models import RefreshToken
from .serializers import *


now = datetime.now()
tg_targets = getattr(settings, 'SUPERADMIN_TELEGRAM_ID', '')

if isinstance(tg_targets, str):
    tg_targets = [int(x) for x in tg_targets.split(',') if x.strip().isdigit()]


def is_super_admin(user):
    """Проверка, является ли пользователь супер-администратором"""
    return user.is_authenticated and user.role == 'super_admin'


def get_tokens_for_user(user):
    """Генерация Access и Refresh токенов для пользователя"""
    RefreshToken.objects.filter(user=user).delete()  # Удаляем старые токены
    refresh = JWTRefreshToken.for_user(user)
    access = refresh.access_token
    
    # Сохраняем refresh token в БД
    expires_at = timezone.now() + timedelta(days=14)
    RefreshToken.objects.create(
        user=user,
        token=str(refresh),
        jti=refresh['jti'],
        expires_at=expires_at
    )
    
    return {
        'refresh': str(refresh),
        'access': str(access),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def register_view(request):
    """
    Регистрация нового пользователя с установкой токенов в http-only cookies
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)

        send_event_async({
            "event": "registration",
            "tg_id": tg_targets,
            "data": {
                "name": getattr(user, 'full_name', None),
                "phone": getattr(user, 'phone_number', None),
                "email": user.email,
                "date": now.strftime("%d-%m-%Y"),
                "time": now.strftime("%H:%M:%S"),
            }
        })
        
        response_data = {
            'user': UserSerializer(user).data,
            'access_token': tokens['access'],
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
        
        # Дополнительный cookie для SSE (БЕЗ httponly, чтобы JS мог прочитать)
        res.set_cookie(
            key='sse_token',
            value=tokens['access'],
            max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=False,  # JavaScript может читать этот cookie для SSE
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )
        
        # Добавляем CSRF токен в header
        res['X-CSRFToken'] = csrf.get_token(request)
        
        return res
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """
    Авторизация пользователя с установкой токенов в http-only cookies
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
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
    
    # Генерируем токены
    tokens = get_tokens_for_user(user)

    send_event_async({
        "event": "authorization",
        "tg_id": tg_targets,
        "data": {
            "name": getattr(user, 'full_name', None),
            "phone": getattr(user, 'phone_number', None),
            "email": user.email,
            "role": getattr(user, 'role', None),
            "date": now.strftime("%d-%m-%Y"),
            "time": now.strftime("%H:%M:%S"),
        }
    })
    
    # Создаем response
    response_data = {
        'user': UserSerializer(user).data,
        'access_token': tokens['access'],  # Отправляем access token в body для совместимости
        'message': 'Авторизация успешна'
    }
    
    res = Response(response_data, status=status.HTTP_200_OK)
    
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
    
    # Дополнительный cookie для SSE (БЕЗ httponly, чтобы JS мог прочитать)
    res.set_cookie(
        key='sse_token',
        value=tokens['access'],
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        httponly=False,  # JavaScript может читать этот cookie для SSE
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
    )
    
    # Добавляем CSRF токен в header
    res['X-CSRFToken'] = csrf.get_token(request)
    
    return res


@api_view(['POST'])
def logout_view(request):
    """
    Выход пользователя (инвалидация токенов и удаление cookies)
    """
    # Получаем refresh token из cookie
    refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])

    if refresh_token:
        try:
            # Добавляем в blacklist
            token = JWTRefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Игнорируем ошибки, если токен уже недействителен
        
        # Удаляем из БД
        RefreshToken.objects.filter(token=refresh_token).delete()

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
    response.delete_cookie(
        key='sse_token',
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
    
    try:
        # Валидируем и создаем новый access token
        refresh = JWTRefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        
        # Если ROTATE_REFRESH_TOKENS = True, получаем новый refresh token
        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
            refresh.set_jti()
            refresh.set_exp()
            new_refresh_token = str(refresh)
        else:
            new_refresh_token = refresh_token
        
        response = Response({
            'access': access_token
        }, status=status.HTTP_200_OK)
        
        # Обновляем access token в cookie
        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=access_token,
            max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
        )
        
        # Если был создан новый refresh token - обновляем cookie
        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=new_refresh_token,
                max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH']
            )
        
        # Добавляем CSRF токен
        response['X-CSRFToken'] = request.COOKIES.get('csrftoken')
        
        return response
        
    except TokenError:
        return Response({
            'error': 'Неверный или истекший refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Получение информации о текущем пользователе
    """
    serializer = UserSerializer(request.user)
    # send_event_async({
    #     "event": "test",
    #     "tg_id": tg_targets,
    #     "data": {
    #         # "name": getattr(request.user, 'full_name', None),
    #         # "email": request.user.email,
    #         # "role": getattr(request.user, 'role', None),
    #         # "date": now.strftime("%d-%m-%Y"),
    #         # "time": now.strftime("%H:%M:%S"),
    #     }
    # })
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
