"""
Сервис для работы с доступными временными слотами врачей.
Чистая бизнес-логика без привязки к views или моделям.
"""
from datetime import datetime, date, time, timedelta
from typing import Dict, List, Optional, Tuple
from django.db.models import Q


def get_available_slots(doctor, start_date: date, service=None, days_ahead: int = 7) -> Dict[str, List[Dict[str, str]]]:
    """
    Получить свободные временные слоты врача на N дней вперед.
    
    Args:
        doctor: Объект Doctor
        start_date: Дата начала поиска
        service: Объект Service (опционально) - влияет на длительность приема
        days_ahead: Количество дней для поиска (по умолчанию 7)
    
    Returns:
        Словарь вида {"2025-01-20": [{"time_start": "09:00", "time_end": "09:30"}, ...]}
    """
    result = {}
    
    # Определяем длительность приема
    duration_minutes = service.duration if service and hasattr(service, 'duration') else doctor.default_duration
    
    # Маппинг дней недели
    weekday_map = {
        0: 'mon', 1: 'tue', 2: 'wed', 3: 'thu',
        4: 'fri', 5: 'sat', 6: 'sun'
    }
    
    # Получаем все активные записи врача на период
    end_date = start_date + timedelta(days=days_ahead - 1)
    
    # Импортируем здесь, чтобы избежать циклических зависимостей
    from appointment.models import Appointment
    
    # Получаем только активные записи (исключаем отменённые и завершённые)
    busy_appointments = Appointment.objects.filter(
        doctor=doctor,
        date__gte=start_date,
        date__lte=end_date
    ).exclude(
        status__in=['canceled', 'rejected', 'finished', 'no_show']
    ).values('date', 'time_start')
    
    # Группируем записи по датам для быстрого доступа
    busy_by_date = {}
    for apt in busy_appointments:
        date_str = apt['date'].isoformat()
        if date_str not in busy_by_date:
            busy_by_date[date_str] = []
        busy_by_date[date_str].append(apt['time_start'])
    
    # Обрабатываем каждый день
    current_date = start_date
    for _ in range(days_ahead):
        date_str = current_date.isoformat()
        weekday = weekday_map[current_date.weekday()]
        
        # Проверяем, работает ли врач в этот день
        if not doctor.working_days.get(weekday, False):
            result[date_str] = []
            current_date += timedelta(days=1)
            continue
        
        # Получаем рабочие часы
        working_hours = doctor.working_hours.get(weekday)
        if not working_hours or len(working_hours) < 2:
            result[date_str] = []
            current_date += timedelta(days=1)
            continue
        
        work_start = _parse_time(working_hours[0])
        work_end = _parse_time(working_hours[1])
        
        # Получаем обеденное время
        lunch_start = None
        lunch_end = None
        lunch_time = doctor.lunch_time.get(weekday)
        if lunch_time and len(lunch_time) >= 2:
            lunch_start = _parse_time(lunch_time[0])
            lunch_end = _parse_time(lunch_time[1])
        
        # Получаем занятые слоты на этот день
        busy_slots = busy_by_date.get(date_str, [])
        
        # Генерируем свободные слоты
        available = _generate_slots(
            work_start=work_start,
            work_end=work_end,
            lunch_start=lunch_start,
            lunch_end=lunch_end,
            duration_minutes=duration_minutes,
            busy_slots=busy_slots,
            current_date=current_date
        )
        
        result[date_str] = available
        current_date += timedelta(days=1)
    
    return result


def is_slot_available(doctor, appointment_date: date, time_start: time, duration_minutes: int = None) -> Tuple[bool, Optional[str]]:
    """
    Проверить, доступен ли конкретный временной слот для записи.
    Используется при создании Appointment для защиты от двойного бронирования.
    
    Args:
        doctor: Объект Doctor
        appointment_date: Дата записи
        time_start: Время начала
        duration_minutes: Длительность приёма в минутах (по умолчанию берётся из doctor.default_duration)
    
    Returns:
        Tuple (is_available: bool, error_message: Optional[str])
    """
    # Определяем длительность приема
    if duration_minutes is None:
        duration_minutes = doctor.default_duration
    # Маппинг дней недели
    weekday_map = {
        0: 'mon', 1: 'tue', 2: 'wed', 3: 'thu',
        4: 'fri', 5: 'sat', 6: 'sun'
    }
    
    weekday = weekday_map[appointment_date.weekday()]
    
    # 1. Проверяем, работает ли врач в этот день
    if not doctor.working_days.get(weekday, False):
        return False, f"Врач не работает в {_get_weekday_name(weekday)}"
    
    # 2. Проверяем рабочие часы
    working_hours = doctor.working_hours.get(weekday)
    if not working_hours or len(working_hours) < 2:
        return False, "Не указаны рабочие часы для этого дня"
    
    work_start = _parse_time(working_hours[0])
    work_end = _parse_time(working_hours[1])
    
    # Вычисляем время окончания приёма
    time_start_minutes = _time_to_minutes(time_start)
    time_end_minutes = time_start_minutes + duration_minutes
    time_end = _minutes_to_time(time_end_minutes)
    
    if time_start < work_start or time_end > work_end:
        return False, f"Время вне рабочих часов ({working_hours[0]} - {working_hours[1]})"
    
    # 3. Проверяем обеденное время
    lunch_time = doctor.lunch_time.get(weekday)
    if lunch_time and len(lunch_time) >= 2:
        lunch_start = _parse_time(lunch_time[0])
        lunch_end = _parse_time(lunch_time[1])
        
        if _times_overlap(time_start, time_end, lunch_start, lunch_end):
            return False, f"Время пересекается с обедом ({lunch_time[0]} - {lunch_time[1]})"
    
    # 4. Проверяем существующие записи (исключаем отменённые и завершённые)
    from appointment.models import Appointment
    
    # Получаем все активные записи на эту дату
    existing_appointments = Appointment.objects.filter(
        doctor=doctor,
        date=appointment_date
    ).exclude(
        status__in=['canceled', 'rejected', 'finished', 'no_show']
    ).values('time_start')
    
    # Проверяем пересечения с существующими записями
    for apt in existing_appointments:
        apt_start_minutes = _time_to_minutes(apt['time_start'])
        apt_end_minutes = apt_start_minutes + duration_minutes
        
        # Проверяем пересечение временных интервалов
        if time_start_minutes < apt_end_minutes and apt_start_minutes < time_end_minutes:
            return False, "Это время уже занято"
    
    return True, None


def _parse_time(time_str: str) -> time:
    """Преобразовать строку времени в объект time."""
    return datetime.strptime(time_str, "%H:%M").time()


def _time_to_minutes(t: time) -> int:
    """Преобразовать time в минуты от начала дня."""
    return t.hour * 60 + t.minute


def _minutes_to_time(minutes: int) -> time:
    """Преобразовать минуты от начала дня в time."""
    return time(hour=minutes // 60, minute=minutes % 60)


def _times_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    """Проверить, пересекаются ли два временных интервала."""
    return start1 < end2 and start2 < end1


def _generate_slots(
    work_start: time,
    work_end: time,
    lunch_start: Optional[time],
    lunch_end: Optional[time],
    duration_minutes: int,
    busy_slots: List[time],
    current_date: date
) -> List[Dict[str, str]]:
    """
    Генерировать свободные временные слоты.
    
    Args:
        work_start: Начало рабочего дня
        work_end: Конец рабочего дня
        lunch_start: Начало обеда (опционально)
        lunch_end: Конец обеда (опционально)
        duration_minutes: Длительность приема
        busy_slots: Список занятых time_start (объекты time)
        current_date: Текущая дата (для фильтрации прошедших слотов)
    
    Returns:
        Список свободных слотов (только time_start)
    """
    slots = []
    
    # Преобразуем время в минуты для удобства работы
    current_minutes = _time_to_minutes(work_start)
    end_minutes = _time_to_minutes(work_end)
    
    # Получаем текущее время
    now = datetime.now()
    is_today = current_date == now.date()
    current_time_minutes = _time_to_minutes(now.time()) if is_today else 0
    
    # Преобразуем занятые слоты в минуты для быстрой проверки
    busy_intervals = []
    for busy_start in busy_slots:
        busy_start_minutes = _time_to_minutes(busy_start)
        busy_end_minutes = busy_start_minutes + duration_minutes
        busy_intervals.append((busy_start_minutes, busy_end_minutes))
    
    while current_minutes + duration_minutes <= end_minutes:
        slot_start = _minutes_to_time(current_minutes)
        slot_end_minutes = current_minutes + duration_minutes
        
        # Пропускаем прошедшие слоты для сегодняшнего дня
        if is_today and current_minutes < current_time_minutes:
            current_minutes += duration_minutes
            continue
        
        # Проверяем, не попадает ли слот в обед
        if lunch_start and lunch_end:
            lunch_start_minutes = _time_to_minutes(lunch_start)
            lunch_end_minutes = _time_to_minutes(lunch_end)
            if current_minutes < lunch_end_minutes and lunch_start_minutes < slot_end_minutes:
                current_minutes += duration_minutes
                continue
        
        # Проверяем, не занят ли слот
        is_busy = False
        for busy_start_min, busy_end_min in busy_intervals:
            if current_minutes < busy_end_min and busy_start_min < slot_end_minutes:
                is_busy = True
                break
        
        if not is_busy:
            slots.append({
                'time_start': slot_start.strftime('%H:%M')
            })
        
        current_minutes += duration_minutes
    
    return slots


def _get_weekday_name(weekday_code: str) -> str:
    """Получить название дня недели на русском."""
    names = {
        'mon': 'понедельник',
        'tue': 'вторник',
        'wed': 'среду',
        'thu': 'четверг',
        'fri': 'пятницу',
        'sat': 'субботу',
        'sun': 'воскресенье'
    }
    return names.get(weekday_code, weekday_code)
