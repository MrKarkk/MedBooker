import json
import time
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.db.models import Count as _Count
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken 

from core.models import Clinic, Doctor, Service
from core.utils import patient_call_synthesis_in_memory
from users.models import User

from .availability import get_available_slots, is_slot_available
from .models import Appointment
from .serializers import *


sse_clients = {}
# Глобальный словарь для отслеживания статусов записей (чтобы не синтезировать повторно)
appointment_statuses = {}
logger = logging.getLogger(__name__)

# Кэш результатов запроса очереди: clinic_key -> (list[Appointment], timestamp)
# Позволяет N SSE-клиентам одной клиники делать 1 запрос вместо N запросов в секунду
_queue_cache: dict = {}
_queue_cache_lock = threading.Lock()
_QUEUE_CACHE_TTL = 0.8  # секунды

# Пул потоков для неблокирующего синтеза речи (SpeechKit API)
_synth_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix='speech_synth')


def _get_queue_appointments(clinic_id, today):
    """Возвращает список записей из кэша или из БД (если кэш устарел)."""
    cache_key = f"{clinic_id}_{today}"
    now = time.monotonic()
    with _queue_cache_lock:
        entry = _queue_cache.get(cache_key)
        if entry and (now - entry[1]) < _QUEUE_CACHE_TTL:
            return entry[0]
    # Запрос вне блокировки, чтобы не держать lock во время IO
    fresh_data = list(
        Appointment.objects.filter(clinic_id=clinic_id, date=today)
        .select_related('doctor', 'clinic', 'service')
        .order_by('time_start')
    )
    with _queue_cache_lock:
        _queue_cache[cache_key] = (fresh_data, time.monotonic())
    return fresh_data


def resolve_admin_clinic(user, clinic_id=None, required_roles=None):
    """Находит клинику, в которой пользователь является админом."""
    if required_roles and user.role not in required_roles:
        return None, Response(
            {'error': 'У вас нет прав для доступа'},
            status=status.HTTP_403_FORBIDDEN,
        )

    clinics_qs = user.clinics.all().order_by('id')
    if clinic_id is not None:
        clinic = clinics_qs.filter(id=clinic_id).first()
    else:
        # При отсутствии явного clinic_id выбираем первую доступную клинику,
        # где включена электронная очередь, иначе просто первую связанную клинику.
        clinic = clinics_qs.filter(is_electronic_queue=True).first() or clinics_qs.first()

    if not clinic:
        return None, Response(
            {'error': 'Клиника не найдена или у вас нет доступа'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return clinic, None


@api_view(['POST'])
@permission_classes([AllowAny])
def search_available_doctors(request):
    """
    Поиск доступных врачей с использованием сервиса availability.
    Возвращает врачей со свободными слотами на 7 дней вперед.
    """
    service_id = request.data.get('service')
    city = request.data.get('city')
    search_date_str = request.data.get('date')
    
    if not all([service_id, city, search_date_str]):
        logger.debug(f"Неполные данные для поиска врачей: {request.data}")
        return Response(
            {'error': 'Необходимо указать услугу, город и дату'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        search_date = datetime.strptime(search_date_str, '%Y-%m-%d').date()
    except ValueError:
        logger.debug(f"Неверный формат даты: {search_date_str}")
        return Response(
            {'error': 'Неверный формат даты. Используйте YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from core.models import Service
        service = Service.objects.get(id=service_id)
        logger.debug(f"Найдена услуга для поиска: {service.name} (ID: {service_id})")
    except Service.DoesNotExist:
        logger.debug(f"Услуга {service_id} не найдена")
        return Response(
            {'error': 'Услуга не найдена'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Находим всех врачей, которые предоставляют эту услугу в указанном городе
    doctors = Doctor.objects.filter(
        services__id=service_id,
        clinic__city=city,
        clinic__is_verified=True,
        clinic__is_active=True,
        clinic__is_online_booking=True,
        is_active=True,
        available_for_booking=True
    ).select_related('clinic').prefetch_related('services').distinct()
    
    if not doctors.exists():
        logger.debug(f"Врачи для услуги {service.name} в городе {city} не найдены")
        return Response(
            {'message': 'Врачи не найдены', 'doctors': []},
            status=status.HTTP_200_OK
        )
    
    # Используем сервис availability для получения слотов    
    results = []
    for doctor in doctors:
        # Получаем свободные слоты на 7 дней
        slots = get_available_slots(
            doctor=doctor,
            start_date=search_date,
            service=service,
            days_ahead=3
        )
        
        # Проверяем, есть ли хотя бы один свободный слот
        has_slots = any(day_slots for day_slots in slots.values())
        
        if has_slots:
            # Формируем данные врача
            doctor_data = {
                'id': doctor.id,
                'full_name': doctor.full_name,
                'specialty': doctor.specialty,
                'work_experience': doctor.work_experience,
                'price': float(doctor.price),
                'rating': doctor.rating,
                'clinic': {
                    'id': doctor.clinic.id,
                    'name': doctor.clinic.name,
                    'address': doctor.clinic.address,
                    'city': doctor.clinic.city,
                },
                'slots': slots  # Слоты на 7 дней
            }
            results.append(doctor_data)
    
    # Сортировка: врачи с большим количеством слотов в начале списка
    results.sort(
        key=lambda x: sum(len(day_slots) for day_slots in x['slots'].values()),
        reverse=True
    )
    
    logger.debug(f"Найдено {len(results)} врачей с доступными слотами для услуги {service.name} в городе {city}")
    return Response({
        'doctors': results,
        'search_params': {
            'service': service_id,
            'city': city,
            'date': search_date.isoformat()
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_appointment(request):
    """Создание новой записи на приём с защитой от двойного бронирования"""
    serializer = AppointmentCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        # Используем атомарную транзакцию для защиты от race condition
        with transaction.atomic():
            # Получаем данные из валидированного serializer
            doctor = serializer.validated_data['doctor']
            appointment_date = serializer.validated_data['date']
            time_start = serializer.validated_data['time_start']
            service = serializer.validated_data.get('service')
            
            # Определяем длительность приёма
            duration_minutes = service.duration if service and hasattr(service, 'duration') else doctor.default_duration
            
            # Проверяем доступность слота перед созданием
            is_available, error_message = is_slot_available(
                doctor=doctor,
                appointment_date=appointment_date,
                time_start=time_start,
                duration_minutes=duration_minutes
            )
            
            if not is_available:
                logger.debug(f"Попытка забронировать занятый слот: Врач {doctor.full_name}, Дата {appointment_date}, Время {time_start}")
                return Response(
                    {'error': error_message or 'Выбранный временной слот недоступен'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            appointment = serializer.save(created_by='patient', status='pending')

        # Возвращаем полные данные с названиями
        full_serializer = AppointmentSerializer(appointment)
        logger.debug(f"Возвращаем {full_serializer} полные данные с названиями")
        return Response(full_serializer.data, status=status.HTTP_201_CREATED)
    
    logger.debug(f"Ошибка при создании записи {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_appointments(request):
    """Получение записей текущего пользователя"""
    user = request.user
    
    if user.role == 'doctor':
        # Находим врача по tg_id или phone_number для надёжной связи (не по имени)
        doctor = Doctor.objects.filter(
            Q(tg_id=user.tg_id, tg_id__isnull=False) |
            Q(phone_number=user.phone_number)
        ).first()

        if not doctor:
            return Response(
                {'error': 'Профиль врача не найден. Обратитесь к администратору.'},
                status=status.HTTP_404_NOT_FOUND
            )

        appointments = Appointment.objects.filter(
            doctor=doctor
        ).select_related('doctor', 'clinic', 'service').order_by('-date', '-time_start')

        serializer = AppointmentSerializer(appointments, many=True)
        logger.debug(f"Успешная отправка записей врача: {user}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        logger.debug(f"Пользователь {user} пытается просмотреть записи, но не является врачом")
        return Response(
            {'error': 'Только врачи могут просматривать свои записи'},
            status=status.HTTP_403_FORBIDDEN
        )
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_clinic_appointments(request, clinic_id):
    """Получение всех записей клиники за последние 7 дней (для администраторов клиники и очереди)"""
    user = request.user

    if user.role not in ['clinic_admin', 'clinic_queue_admin']:
        return Response(
            {'error': 'У вас нет прав для просмотра записей'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Проверка, что клиника принадлежит пользователю
    if not user.clinics.filter(id=clinic_id).exists():
        return Response(
            {'error': 'Клиника не найдена или у вас нет доступа'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    seven_days_ago = timezone.now().date() - timedelta(days=7)
    
    # Получение записей клиники за последние 7 дней
    appointments = Appointment.objects.filter(
        clinic_id=clinic_id,
        date__gte=seven_days_ago
    ).select_related(
        'doctor', 'clinic', 'service'
    ).order_by('-date', '-time_start')
    
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_appointment(request, appointment_id):
    """Обновление записи (только для администратора клиники)"""
    user = request.user
    
    # Проверка роли и прав
    if user.role == 'clinic_admin':
        # Админ клиники может менять любые записи своей клиники
        try:
            appointment = Appointment.objects.select_related('clinic').get(id=appointment_id)
        except Appointment.DoesNotExist:
            logger.debug(f"Запись {appointment_id} не найдена")
            return Response(
                {'error': 'Запись не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        if not user.clinics.filter(id=appointment.clinic_id).exists():
            logger.debug(f"Пользователь {user} пытается просмотреть все записи, но не является админом")
            return Response(
                {'error': 'У вас нет доступа к этой записи'},
                status=status.HTTP_403_FORBIDDEN
            )
        allowed_fields = None  # Админ может менять любые поля
    elif user.role == 'doctor':
        # Врач может менять только свои записи — ищем привязанного врача по tg_id/phone
        doctor = Doctor.objects.filter(
            Q(tg_id=user.tg_id, tg_id__isnull=False) |
            Q(phone_number=user.phone_number)
        ).first()
        if not doctor:
            return Response(
                {'error': 'Профиль врача не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            appointment = Appointment.objects.get(id=appointment_id, doctor=doctor)
        except Appointment.DoesNotExist:
            logger.debug(f"Запись {appointment_id} не найдена или врач не имеет доступа")
            return Response(
                {'error': 'Запись не найдена или у вас нет доступа'},
                status=status.HTTP_404_NOT_FOUND
            )
        allowed_fields = ['status', 'comment']  # Врач может менять только статус и комментарий
    else:
        logger.debug(f"Пользователь {user} пытается изменить запись {appointment_id}, но не имеет прав")
        return Response(
            {'error': 'У вас нет прав для изменения записей'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Оставляем только разрешённые поля для врача
    data = request.data
    if allowed_fields is not None:
        data = {field: value for field, value in request.data.items() if field in allowed_fields}

    serializer = AppointmentUpdateSerializer(appointment, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        full_serializer = AppointmentSerializer(appointment)
        logger.debug(f"Успешно обновлена запись: {full_serializer.data}")
        return Response(full_serializer.data, status=status.HTTP_200_OK)
    logger.debug(f"Ошибка при обновлении записи {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_services_and_cities(request):
    """Получение списка всех доступных услуг и городов"""
    # Получение услуг
    services = Service.objects.filter(
        doctors__clinic__is_verified=True,
        doctors__clinic__is_active=True,
        doctors__clinic__is_online_booking=True,
    ).distinct().values('id', 'name').order_by('name')
    
    # Получение городов
    cities = Clinic.objects.filter(
        is_active=True, 
        is_verified=True,
        is_online_booking=True
    ).values_list('city', flat=True).distinct().order_by('city')
    
    return Response({
        'services': list(services),
        'cities': list(cities)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_clinic_queue_settings(request, clinic_id=None):
    """Получение настроек электронной очереди клиники"""
    user = request.user
    
    clinic, error_response = resolve_admin_clinic(
        user=user,
        clinic_id=clinic_id,
        required_roles=['clinic_admin', 'clinic_queue_admin'],
    )
    if error_response:
        logger.warning("Пользователь %s не смог получить настройки очереди clinic_id=%s", user.id, clinic_id)
        return error_response
    
    # Проверка, что клиника поддерживает электронную очередь
    if not clinic.is_electronic_queue:
        logger.warning(f"Пользователь {user} пытается получить настройки очереди для клиники {clinic}, но электронная очередь не включена")
        return Response(
            {'error': 'Электронная очередь не включена для этой клиники'},
            status=status.HTTP_400_BAD_REQUEST
        )
    else:
        logger.debug(f"Пользователь {user} запрашивает настройки очереди для клиники {clinic}")
    
    today = datetime.now().date()

    # Фильтруем врачей клиники, которые работают сегодня
    today_weekday = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][today.weekday()]
    doctors = Doctor.objects.filter(
        clinic=clinic,
        is_active=True
    ).filter(
        Q(**{f'working_days__{today_weekday}': True}) & Q(**{f'working_hours__{today_weekday}__isnull': False}) |
        Q(working_hours__isnull=True)
    )

    doctors_data = [{
        'id': d.id,
        'full_name': d.full_name,
    } for d in doctors]

    status_counts = Appointment.objects.filter(
        clinic=clinic,
        date=today
    ).aggregate(
        total=_Count('id'),
        invited=_Count('id', filter=Q(status='invited')),
        confirmed=_Count('id', filter=Q(status='confirmed')),
        finished=_Count('id', filter=Q(status='finished')),
        urgent=_Count('id', filter=Q(status='urgent')),
    )

    response_data = {
        'clinic_id': clinic.id,
        'clinic_name': clinic.name,
        'is_electronic_queue': clinic.is_electronic_queue,
        'is_booking_for_services': clinic.is_booking_for_services,
        'is_booking_for_doctors': clinic.is_booking_for_doctors,
        'doctors': doctors_data,
        'total_appointments_today': status_counts['total'],
        'invited_count': status_counts['invited'],
        'confirmed_count': status_counts['confirmed'],
        'finished_count': status_counts['finished'],
        'urgent_count': status_counts['urgent'],
    }
    
    logger.info(f"Пользователь {user} получил настройки очереди для клиники {clinic}: {response_data}")
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_queue_appointment_by_admin(request, clinic_id=None):
    """Создание записи в электронную очередь админом клиники"""
    user = request.user
    
    # Проверка прав - только clinic_admin может создавать записи
    if user.role != 'clinic_admin':
        logger.warning(f"Пользователь {user} пытается создать запись в электронной очереди, но не имеет прав")
        return Response(
            {'error': 'Только администратор клиники может создавать записи'},
            status=status.HTTP_403_FORBIDDEN
        )

    clinic, error_response = resolve_admin_clinic(
        user=user,
        clinic_id=clinic_id,
        required_roles=['clinic_admin'],
    )
    if error_response:
        logger.warning("Пользователь %s не смог создать запись в очереди clinic_id=%s", user.id, clinic_id)
        return error_response
    
    # Проверка электронной очереди
    if not clinic.is_electronic_queue:
        logger.warning(f"Пользователь {user} пытается создать запись в электронной очереди для клиники {clinic}, но электронная очередь не включена")
        return Response(
            {'error': 'У клиники нет доступа к электронной очереди'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Получаем данные
    service_id = request.data.get('service')
    doctor_id = request.data.get('doctor')
    patient_full_name = request.data.get('patient_full_name')
    patient_phone = request.data.get('patient_phone')
    is_urgent = request.data.get('is_urgent', False)
    
    # Определяем врача
    doctor = None
    service = None
    
    if clinic.is_booking_for_doctors and doctor_id:
        logger.info(f"Клиника {clinic} поддерживает запись по врачам. Ищем врача с ID {doctor_id} для записи пациента {patient_full_name}")
        # Бронирование по врачам
        try:
            doctor = Doctor.objects.get(id=doctor_id, clinic=clinic, is_active=True)
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Врач не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif clinic.is_booking_for_services and service_id:
        logger.info(f"Клиника {clinic} поддерживает запись по услугам. Ищем услугу с ID {service_id} для записи пациента {patient_full_name}")
        # Бронирование по услугам
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response(
                {'error': 'Услуга не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Выбираем врача с наименьшим количеством записей на сегодня
        today = datetime.now().date()
        
        doctor = Doctor.objects.filter(
            clinic=clinic,
            services=service,
            is_active=True
        ).annotate(
            today_appointments=_Count(
                'appointments',
                filter=Q(
                    appointments__date=today,
                    appointments__status__in=['pending', 'invited', 'confirmed']
                )
            )
        ).order_by('today_appointments').first()
        
        if not doctor:
            return Response(
                {'error': 'Нет доступных врачей для данной услуги'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        logger.warning(f"Пользователь {user} пытается создать запись в электронной очереди для клиники {clinic}, но не указал врача или услугу")
        return Response(
            {'error': 'Необходимо указать врача или услугу в зависимости от настроек клиники'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Текущая дата и время
    appointment_date = datetime.now().date()
    time_start = datetime.now().replace(second=0, microsecond=0).time()
    
    # Генерация талона
    full_name = (doctor.full_name or '').strip()
    name_parts = full_name.split() if full_name else []
    
    if len(name_parts) >= 1:
        initials = name_parts[0][0].upper()
    else:
        initials = ""
    
    # Подсчет существующих записей
    existing_count = Appointment.objects.filter(
        clinic=clinic,
        date=appointment_date,
        number_coupon__startswith=initials
    ).count()
    
    seq = existing_count + 1
    number_coupon = f"{initials}{seq:02d}"
    
    # Определение статуса
    # Проверяем есть ли записи со статусом invited или pending
    has_active_appointments = Appointment.objects.filter(
        doctor=doctor,
        date=appointment_date,
        status__in=['invited', 'pending', 'confirmed']
    ).exists()
    
    # Проверяем время обеда
    weekday_map = {0: 'mon', 1: 'tue', 2: 'wed', 3: 'thu', 4: 'fri', 5: 'sat', 6: 'sun'}
    weekday = weekday_map[appointment_date.weekday()]
    lunch_time = doctor.lunch_time.get(weekday, [])
    is_lunch_time = False
    
    if lunch_time and len(lunch_time) >= 2:
        from datetime import datetime as dt
        lunch_start = dt.strptime(lunch_time[0], "%H:%M").time()
        lunch_end = dt.strptime(lunch_time[1], "%H:%M").time()
        is_lunch_time = lunch_start <= time_start < lunch_end
    
    # Устанавливаем статус
    if is_urgent:
        appointment_status = 'urgent'
    elif not has_active_appointments and not is_lunch_time:
        appointment_status = 'invited'
    else:
        appointment_status = 'confirmed'

    logger.info(f"Пользователь {user} создал запись в электронной очереди для клиники {clinic}. Статус: {appointment_status}, Врач: {doctor.full_name}, Пациент: {patient_full_name}, Талон: {number_coupon}")
    
    # Создаем запись
    with transaction.atomic():
        appointment = Appointment.objects.create(
            doctor=doctor,
            clinic=clinic,
            service=service or doctor.services.first(),
            date=appointment_date,
            time_start=time_start,
            patient_full_name=patient_full_name,
            patient_phone=patient_phone,
            number_coupon=number_coupon,
            status=appointment_status,
            created_by='admin',
            source='electronic_queue'
        )
    
    serializer = AppointmentSerializer(appointment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@csrf_exempt
@require_http_methods(["GET"])
def queue_appointments_sse(request, clinic_id=None):
    """SSE поток для получения обновлений очереди в реальном времени (электронная очередь на модели Appointment)"""    
    # Получаем access token только из auth cookie
    auth_cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access')
    token = request.COOKIES.get(auth_cookie_name)
    
    if not token:
        logger.warning("SSE: запрос без токена")
        return JsonResponse({'error': 'Токен не предоставлен'}, status=401)
    
    # Проверяем токен и получаем пользователя
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
    except Exception as e:
        logger.warning(f"SSE: недействительный токен — {e}")
        return JsonResponse({'error': 'Недействительный токен'}, status=401)

    # Проверка прав доступа - админы клиники и админы очереди
    if user.role not in ['clinic_admin', 'clinic_queue_admin']:
        logger.warning(f"SSE: пользователь {user} не имеет прав для просмотра очереди")
        return JsonResponse({'error': 'У вас нет прав для просмотра записей'}, status=403)

    clinic, error_response = resolve_admin_clinic(
        user=user,
        clinic_id=clinic_id,
        required_roles=['clinic_admin', 'clinic_queue_admin'],
    )
    if error_response:
        logger.warning("SSE: пользователь %s не получил доступ к clinic_id=%s", user.id, clinic_id)
        return JsonResponse(error_response.data, status=error_response.status_code)

    clinic_id = clinic.id
    logger.info(f"SSE: пользователь {user} подключается к очереди клиники {clinic} (ID: {clinic_id})")

    def event_stream():
        """Генератор событий SSE"""
        client_id = f"{clinic_id}_{user.id}_{time.time()}"
        
        # Регистрируем клиента
        if clinic_id not in sse_clients:
            sse_clients[clinic_id] = []
        sse_clients[clinic_id].append(client_id)

        # Локальный словарь ожидающих фьючерсов синтеза речи
        # {appointment_id: {'future': Future, 'coupon': str, ...}}
        pending_synth = {}
        
        try:
            # Отправляем начальное подключение
            yield f"data: {json.dumps({'type': 'connected', 'clinic_id': clinic_id})}\n\n"
            
            # Отправляем текущие данные (электронная очередь на сегодня)
            today = datetime.now().date()
            queue_appointments = _get_queue_appointments(clinic_id, today)
            
            # Инициализируем глобальный словарь статусов для этой клиники, если еще не создан
            clinic_key = f"clinic_{clinic_id}_{today}"
            if clinic_key not in appointment_statuses:
                appointment_statuses[clinic_key] = {}
            
            # Сохраняем начальные статусы в глобальный словарь
            for apt in queue_appointments:
                appointment_statuses[clinic_key][apt.id] = apt.status
            
            serializer = AppointmentSerializer(queue_appointments, many=True)
            yield f"data: {json.dumps({'type': 'initial', 'appointments': serializer.data})}\n\n"
            
            # Держим соединение открытым и отправляем обновления с фиксированным интервалом
            while True:
                loop_started = time.monotonic()

                # Отправляем актуальные данные
                queue_appointments = _get_queue_appointments(clinic_id, today)
                
                # --- Собираем готовые результаты синтеза речи (неблокирующе) ---
                voice_announcements = []
                completed_ids = []
                for apt_id, synth_info in pending_synth.items():
                    future = synth_info['future']
                    if future.done():
                        completed_ids.append(apt_id)
                        try:
                            audio_base64 = future.result()
                            synth_elapsed = time.monotonic() - synth_info['submitted_at']
                            if audio_base64:
                                voice_announcements.append({
                                    'appointment_id': apt_id,
                                    'audio_base64': audio_base64,
                                    'number_coupon': synth_info['coupon'] or (
                                        synth_info['time_start'].strftime("%H:%M") if synth_info['time_start'] else ''
                                    ),
                                    'patient_name': synth_info['patient_name'],
                                    'cabinet_number': synth_info['cabinet_number'],
                                })
                                logger.info(
                                    f"[CALL] Синтезировано аудио для пациента: {synth_info['patient_name']}, "
                                    f"талон: {synth_info['coupon'] or 'без талона'}, "
                                    f"размер base64: {len(audio_base64)} символов, "
                                    f"время синтеза: {synth_elapsed:.3f}с"
                                )
                            else:
                                logger.warning(
                                    f"[CALL] Не удалось синтезировать аудио для {synth_info['patient_name']}, "
                                    f"время ожидания синтеза: {synth_elapsed:.3f}с"
                                )
                        except Exception as exc:
                            logger.error(f"[CALL] Ошибка синтеза для appointment {apt_id}: {exc}")
                for apt_id in completed_ids:
                    del pending_synth[apt_id]

                # --- Проверяем изменения статусов и отправляем новые задачи синтеза ---
                for apt in queue_appointments:
                    current_status = apt.status
                    previous_status = appointment_statuses[clinic_key].get(apt.id)
                    
                    # Логируем все изменения статусов
                    if previous_status and current_status != previous_status:
                        logger.info(f"[STATUS_CHANGE] Клиника {clinic_id}, ID:{apt.id}, {apt.patient_full_name}: {previous_status} -> {current_status}")
                    
                    # Если статус изменился на "invited" - отправляем синтез в фоновый поток
                    if current_status == 'invited' and previous_status != 'invited':
                        if apt.id not in pending_synth:  # не отправлять повторно
                            coupon = apt.number_coupon or ''
                            cabinet_number = getattr(apt.doctor, 'cabinet_number', '') if apt.doctor else ''
                            logger.info(f"[VOICE_TRIGGER] Запускаем синтез (async) для пациента: {apt.patient_full_name}, талон: {coupon or 'без талона'}")
                            logger.debug(f"[VOICE_DEBUG] Параметры: patient={apt.patient_full_name}, coupon={coupon or 'нет'}, cabinet={cabinet_number or 'нет'}")

                            future = _synth_executor.submit(
                                patient_call_synthesis_in_memory,
                                patient_name=apt.patient_full_name,
                                number_coupon=coupon,
                                cabinet_number=cabinet_number,
                            )
                            pending_synth[apt.id] = {
                                'future': future,
                                'coupon': coupon,
                                'patient_name': apt.patient_full_name,
                                'cabinet_number': cabinet_number,
                                'time_start': apt.time_start,
                                'submitted_at': time.monotonic(),
                            }

                    # Обновляем статус в глобальном словаре
                    if previous_status is None or current_status != previous_status:
                        appointment_statuses[clinic_key][apt.id] = current_status
                
                serializer = AppointmentSerializer(queue_appointments, many=True)
                response_data = {
                    'type': 'update',
                    'appointments': serializer.data
                }
                
                # Если есть голосовые объявления, добавляем их в ответ
                if voice_announcements:
                    response_data['voice_announcements'] = voice_announcements
                    logger.info(f"[SSE_SEND] Отправляем {len(voice_announcements)} голосовых объявлений клиенту {client_id}")
                
                yield f"data: {json.dumps(response_data)}\n\n"

                # Ждём до следующего тика (1 секунда), чтобы не нагружать CPU
                elapsed = time.monotonic() - loop_started
                sleep_time = max(0, 1.0 - elapsed)
                time.sleep(sleep_time)
                
        except GeneratorExit:
            # Клиент отключился — отменяем незавершённые задачи синтеза
            for synth_info in pending_synth.values():
                synth_info['future'].cancel()
            pending_synth.clear()
            if clinic_id in sse_clients and client_id in sse_clients[clinic_id]:
                sse_clients[clinic_id].remove(client_id)
                if not sse_clients[clinic_id]:
                    del sse_clients[clinic_id]
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


