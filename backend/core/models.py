from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from users.models import User
from .utils import *


class Clinic(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    city = models.CharField(max_length=100, db_index=True)

    address = models.CharField(max_length=255)
    working_hours = models.JSONField(default=default_working_hours) 
    working_days = models.JSONField(default=default_working_days) 

    phone_number = models.CharField(max_length=20, validators=[RegexValidator(r'^\+?\d{7,15}$')])
    admin = models.ManyToManyField(User, related_name='clinics', blank=True)

    is_verified = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_online_booking = models.BooleanField(default=False, db_index=True)
    is_electronic_queue = models.BooleanField(default=False, db_index=True, help_text="если is_electronic_queue = true то один из двух вариантов ниже должен быть true")
    is_booking_for_services = models.BooleanField(default=False, db_index=True, help_text="разрешена ли запись на по услугам на фронте")
    is_booking_for_doctors = models.BooleanField(default=False, db_index=True, help_text="разрешена ли запись на по фио врачей на фронте")
    is_notification_telegram = models.BooleanField(default=False, db_index=True)

    online_queue_only = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.is_electronic_queue and not (self.is_booking_for_services or self.is_booking_for_doctors):
            raise ValidationError(
                'Если включена электронная очередь (is_electronic_queue), '
                'должен быть включен хотя бы один из вариантов: '
                'запись на услуги (is_booking_for_services) или '
                'запись к врачам (is_booking_for_doctors).'
            )

    def __str__(self):
        return f"{self.name} — {self.city}"

    class Meta:
        verbose_name = "Клиника"
        verbose_name_plural = "Клиники"
        indexes = [
            models.Index(fields=['city']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_online_booking']),
            models.Index(fields=['is_electronic_queue']),
            models.Index(fields=['is_notification_telegram']),
            models.Index(fields=['online_queue_only']),
            models.Index(fields=['is_active', 'is_verified']), 
            models.Index(fields=['-rating']), 
        ]

class Doctor(models.Model):
    full_name = models.CharField(max_length=255, db_index=True)
    phone_number = models.CharField(max_length=20, validators=[RegexValidator(r'^\+?\d{7,15}$')], blank=True)
    tg_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='Telegram ID')

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='doctors')
    working_days = models.JSONField(default=default_working_days)
    working_hours = models.JSONField(default=default_working_hours)
    lunch_time = models.JSONField(default=default_lunch_time)
    cabinet_number = models.CharField(max_length=50, blank=True) 

    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    services = models.ManyToManyField('Service', related_name='doctors', help_text="Услуги, которые предоставляет врач")

    available_for_booking = models.BooleanField(default=True)
    default_duration = models.PositiveIntegerField(default=30)
    rating = models.FloatField(default=0.0, db_index=True)

    is_active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return f"{self.full_name} ({self.services})"

    class Meta:
        verbose_name = "Врач"
        verbose_name_plural = "Врачи"
        indexes = [
            models.Index(fields=['clinic', 'is_active']),
            models.Index(fields=['rating']),
            models.Index(fields=['-rating']),  
            models.Index(fields=['is_active']),
            models.Index(fields=['available_for_booking']),
            models.Index(fields=['specialty']),
        ]

class Service(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"