from django.db import models
from core.models import Clinic, Doctor, Service


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает подтверждения'
        CONFIRMED = 'confirmed', 'Подтверждено'
        CANCELED = 'canceled', 'Отменено пациентом'
        REJECTED = 'rejected', 'Отменено клиникой'
        FINISHED = 'finished', 'Прием завершен'
        INVITED = 'invited', 'Приглашен'
        NO_SHOW = 'no_show', 'Пациент не пришел'
        URGENT = 'urgent', 'Срочный'

    patient_full_name = models.CharField(max_length=255)
    patient_phone = models.CharField(max_length=255)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, related_name='appointments')

    date = models.DateField(db_index=True)
    time_start = models.TimeField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    number_coupon = models.CharField(max_length=20, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)

    created_by = models.CharField(
        max_length=50,
        choices=[
            ('patient', 'Пациент'),
            ('clinic', 'Клиника'),
            ('admin', 'Администратор'),
        ]
    )

    source = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Запись {self.patient_full_name} → {self.doctor} ({self.date} {self.time_start})"

    class Meta:
        verbose_name = "Запись"
        verbose_name_plural = "Записи"
        ordering = ['-date', '-time_start']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['clinic', 'date']),
            models.Index(fields=['doctor', 'date']), 
            models.Index(fields=['-created_at']), 
            models.Index(fields=['clinic', 'status', 'date']), 
        ]

class AppointmentQueueOnly(models.Model):
    class StatusQueueOnly(models.TextChoices):
        PENDING = 'pending', 'Ожидание'
        INVITED = 'invited', 'Приглашен'
        MISSED = 'missed', 'Пропущен'
        CANCELED = 'canceled', 'Отменен'
        FINISHED = 'finished', 'Завершен'
        URGENT = 'urgent', 'Срочный'

    patient_full_name = models.CharField(max_length=255)
    patient_phone = models.CharField(max_length=255)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='appointmentsQueueOnly')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointmentsQueueOnly')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, related_name='appointmentsQueueOnly')
    date = models.DateField(db_index=True)
    time_start = models.TimeField()
    status = models.CharField(max_length=20, choices=StatusQueueOnly.choices, default=StatusQueueOnly.PENDING)
    number_coupon = models.CharField(max_length=20, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Запись {self.patient_full_name} → {self.doctor} ({self.date} {self.time_start})"

    class Meta:
        verbose_name = "Запись онлайн очередь"
        verbose_name_plural = "Записи онлайн очередей"
        ordering = ['-date', '-time_start']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['clinic', 'date']),
            models.Index(fields=['doctor', 'date']), 
            models.Index(fields=['-created_at']), 
            models.Index(fields=['clinic', 'status', 'date']), 
        ]