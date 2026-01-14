from rest_framework import serializers
from .models import Appointment, AppointmentQueueOnly
from core.models import Doctor, Service


class AppointmentSerializer(serializers.ModelSerializer):
    """Сериализатор для записи на прием"""
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True, allow_null= True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True, allow_null=True)
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)
    doctor_cabinet_number = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_full_name', 'patient_phone',
            'clinic', 'clinic_name',
            'doctor', 'doctor_name', 'doctor_cabinet_number',
            'service', 'service_name',
            'date', 'time_start',
            'number_coupon', 'status', 'comment',
            'created_at', 'updated_at', 'source'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_doctor_cabinet_number(self, obj):
        """Безопасное получение номера кабинета врача"""
        if obj.doctor and hasattr(obj.doctor, 'cabinet_number'):
            return obj.doctor.cabinet_number or None
        return None


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления записи"""
    
    class Meta:
        model = Appointment
        fields = [
            'patient_full_name', 'patient_phone',
            'doctor', 'date', 'time_start',
            'status', 'comment'
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания записи"""
    
    class Meta:
        model = Appointment
        fields = [
            'patient_full_name', 'patient_phone',
            'clinic', 'doctor', 'service',
            'date', 'time_start',
            'comment', 'source'
        ]
    
    def create(self, validated_data):
        if 'status' not in validated_data:
            validated_data['status'] = 'pending'
        return super().create(validated_data)
    
    def validate(self, attrs):
        """Валидация данных перед созданием записи"""
        from datetime import datetime, date as dt_date
        
        # Проверка, что дата не в прошлом
        appointment_date = attrs.get('date')
        if appointment_date < dt_date.today():
            raise serializers.ValidationError({
                'date': 'Нельзя записаться на прошедшую дату'
            })
        
        # Проверка времени
        time_start = attrs.get('time_start')
        service = attrs.get('service')
        doctor = attrs.get('doctor')
        
        # Определяем длительность приёма
        duration_minutes = service.duration if service and hasattr(service, 'duration') else doctor.default_duration
        
        # Вычисляем время окончания
        from datetime import datetime, time as dt_time
        time_start_minutes = time_start.hour * 60 + time_start.minute
        time_end_minutes = time_start_minutes + duration_minutes
        
        # Проверка, что слот не занят (исключаем отменённые и завершённые)
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            date=appointment_date
        ).exclude(
            status__in=['canceled', 'rejected', 'finished', 'no_show']
        ).values('time_start')
        
        # Проверяем пересечения с существующими записями
        for apt in existing_appointments:
            apt_start_minutes = apt['time_start'].hour * 60 + apt['time_start'].minute
            apt_end_minutes = apt_start_minutes + duration_minutes
            
            # Проверяем пересечение временных интервалов
            if time_start_minutes < apt_end_minutes and apt_start_minutes < time_end_minutes:
                raise serializers.ValidationError({
                    'time_start': 'Этот временной слот уже занят'
                })
        
        return attrs


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    """Сериализатор для доктора с доступными слотами"""
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    clinic_address = serializers.CharField(source='clinic.address', read_only=True)
    clinic_phone = serializers.CharField(source='clinic.phone_number', read_only=True)
    photo = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'specialty', 'photo',
            'clinic', 'clinic_name', 'clinic_address', 'clinic_phone',
            'rating', 'price', 'default_duration',
            'working_hours', 'working_days', 'lunch_time'
        ]
    
    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None

class AppointmentQueueOnlyCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания записи в онлайн-очередь"""
    service_name = serializers.CharField(source='service.name', read_only=True)
    status = serializers.ChoiceField(choices=AppointmentQueueOnly.StatusQueueOnly.choices, required=False)

    class Meta:
        model = AppointmentQueueOnly
        fields = [
            'id',
            'patient_full_name', 'patient_phone',
            'clinic', 'doctor', 'service', 'service_name',
            'date', 'time_start',
            'number_coupon',
            'status',
            'comment',
            'created_at', 'updated_at',
        ]
        # allow status to be set from client; other fields remain read-only
        read_only_fields = ('id', 'number_coupon', 'date', 'time_start', 'created_at', 'updated_at')


class AppointmentQueueOnlySerializer(serializers.ModelSerializer):
    """Сериализатор для отображения записей очереди"""
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_cabinet = serializers.CharField(source='doctor.cabinet_number', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = AppointmentQueueOnly
        fields = [
            'id',
            'patient_full_name', 'patient_phone',
            'doctor', 'doctor_name', 'doctor_cabinet',
            'service', 'service_name',
            'date', 'time_start',
            'number_coupon',
            'status',
            'comment',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')