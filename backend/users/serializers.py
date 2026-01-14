from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения информации о пользователе"""
    clinics = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone_number', 'role', 'date_joined', 'clinics', 'tg_id')
        read_only_fields = ('id', 'date_joined')
    
    def get_clinics(self, obj):
        # Если пользователь — администратор клиники, возвращаем только верифицированные клиники
        if obj.role == User.Role.CLINIC_ADMIN:
            return [
                {
                    'id': clinic.id, 
                    'name': clinic.name, 
                    'city': clinic.city, 
                    'phone_number': clinic.phone_number, 
                    'address': clinic.address, 
                    'working_hours': clinic.working_hours,
                    'rating': clinic.rating
                    } 
                    for clinic in obj.clinics.filter(is_verified=True)
                ]
        elif obj.role == User.Role.ONLINE_QUEUE_ADMIN:
            return [
                {
                    'id': clinic.id, 
                    'name': clinic.name, 
                    'city': clinic.city, 
                    'phone_number': clinic.phone_number, 
                    'address': clinic.address, 
                    'working_hours': clinic.working_hours,
                    'rating': clinic.rating
                    } 
                    for clinic in obj.clinics.filter(online_queue_only=True, is_verified=False)
                ]
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации нового пользователя"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('email', 'full_name', 'phone_number', 'password', 'password_confirm', 'role')
        extra_kwargs = {
            'role': {'required': False, 'default': User.Role.PATIENT}
        }
    
    def validate(self, attrs):
        """Проверка совпадения паролей и валидация пароля"""
        password = attrs.get('password')
        password_confirm = attrs.pop('password_confirm', None)
        
        if password != password_confirm:
            raise serializers.ValidationError({'password': 'Пароли не совпадают'})
        
        # Валидация пароля Django
        user = User(**attrs)
        try:
            validate_password(password, user)
        except exceptions.ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        
        return attrs
    
    def create(self, validated_data):
        """Создание пользователя с хэшированным паролем"""
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            phone_number=validated_data['phone_number'],
            role=validated_data.get('role', User.Role.PATIENT)
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Сериализатор для авторизации"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления профиля пользователя"""
    class Meta:
        model = User
        fields = ('full_name', 'phone_number', 'email', 'tg_id')
    
    def validate_email(self, value):
        """Проверка уникальности email"""
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Сериализатор для смены пароля"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Новые пароли не совпадают'})
        
        # Валидация нового пароля
        try:
            validate_password(attrs['new_password'])
        except exceptions.ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        
        return attrs