from rest_framework import serializers
from .models import *


class ClinicSerializer(serializers.ModelSerializer):
    """Базовый сериализатор для клиники с оптимизированными запросами"""
    doctors_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Clinic
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
    
    def get_doctors_count(self, obj):
        """Подсчет активных врачей"""
        # Используем аннотацию из queryset, если доступна
        if hasattr(obj, 'doctors_count'):
            return obj.doctors_count
        return obj.doctors.filter(is_active=True).count()
    
    def validate(self, data):
        """Validate that if electronic queue is enabled, at least one booking type is enabled"""
        # Get current values from instance if updating
        is_electronic_queue = data.get('is_electronic_queue', 
                                        self.instance.is_electronic_queue if self.instance else False)
        is_booking_for_services = data.get('is_booking_for_services',
                                        self.instance.is_booking_for_services if self.instance else False)
        is_booking_for_doctors = data.get('is_booking_for_doctors',
                                        self.instance.is_booking_for_doctors if self.instance else False)
        
        if is_electronic_queue and not (is_booking_for_services or is_booking_for_doctors):
            raise serializers.ValidationError(
                'Если включена электронная очередь (is_electronic_queue), '
                'должен быть включен хотя бы один из вариантов: '
                'запись на услуги (is_booking_for_services) или '
                'запись к врачам (is_booking_for_doctors).'
            )
        
        return data


class ServiceSerializer(serializers.ModelSerializer):
    """Сериализатор для услуги"""
    
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ['id']


class ClinicUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления клиники с расширенной валидацией"""

    class Meta:
        model = Clinic
        fields = [
            'name', 'city', 'address', 
            'working_hours', 'working_days', 
            'phone_number', 'email', 
            'description', 'website', 'rating'
        ]
    
    def validate(self, data):
        """Проверка, что клиника верифицирована"""
        clinic = self.instance
        if clinic and not clinic.is_verified:
            raise serializers.ValidationError('Только верифицированные клиники могут быть отредактированы')
        return data
    
    def validate_email(self, value):
        """Проверка уникальности email"""
        if self.instance:
            # При обновлении исключаем текущую клинику из проверки
            if Clinic.objects.exclude(id=self.instance.id).filter(email=value).exists():
                raise serializers.ValidationError('Клиника с таким email уже существует')
        else:
            if Clinic.objects.filter(email=value).exists():
                raise serializers.ValidationError('Клиника с таким email уже существует')
        return value
    
    def validate_phone_number(self, value):
        """Проверка формата и уникальности телефона"""
        if self.instance:
            if Clinic.objects.exclude(id=self.instance.id).filter(phone_number=value).exists():
                raise serializers.ValidationError('Клиника с таким телефоном уже существует')
        else:
            if Clinic.objects.filter(phone_number=value).exists():
                raise serializers.ValidationError('Клиника с таким телефоном уже существует')
        return value
        
    def validate_rating(self, value):
        """Проверка рейтинга"""
        if value < 0 or value > 5:
            raise serializers.ValidationError('Рейтинг должен быть от 0 до 5')
        return value
    
    def validate_working_hours(self, value):
        """Проверка формата рабочих часов"""
        if not isinstance(value, dict):
            raise serializers.ValidationError('working_hours должен быть объектом')
        
        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        for day, hours in value.items():
            if day not in days:
                raise serializers.ValidationError(f'Неверный день недели: {day}')
            if not isinstance(hours, list) or len(hours) != 2:
                raise serializers.ValidationError(f'Часы для {day} должны быть списком из 2 элементов')
        return value


class DoctorSerializer(serializers.ModelSerializer):
    """Сериализатор для врача с полным расписанием и оптимизацией"""
    photo = serializers.SerializerMethodField()
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    appointments_count = serializers.SerializerMethodField()
    services = ServiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Doctor
        fields = [
            'id', 'photo', 'full_name', 'specialty', 'phone_number',
            'clinic', 'clinic_name',
            'working_days', 'working_hours', 'lunch_time',
            'work_experience', 'price', 'rating',
            'available_for_booking', 'default_duration',
            'services', 'appointments_count'
        ]
        read_only_fields = ['id']
    
    def get_photo(self, obj):
        """Возвращаем абсолютный URL фото"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None
    
    def get_appointments_count(self, obj):
        """Подсчет записей врача"""
        if hasattr(obj, 'appointments_count'):
            return obj.appointments_count
        return obj.appointments.count()


class ReceivedMessageSerializer(serializers.ModelSerializer):
    """Сериализатор для полученного сообщения от пользователя"""
    
    class Meta:
        model = ReceivedMessage
        fields = '__all__'
        read_only_fields = ['id', 'received_at']

class FAQEntrySerializer(serializers.ModelSerializer):
    """Сериализатор для Часто задаваемых вопросов (FAQ)"""
    
    class Meta:
        model = FAQEntry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']