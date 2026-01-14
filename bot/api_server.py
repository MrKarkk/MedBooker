from fastapi import Depends, FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Optional
import logging
import asyncio
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from bot import send_message
from config import settings


app = FastAPI(
    title="Telegram Bot API",
    version="1.0.0"
)

logger = logging.getLogger(__name__)


@app.get("/health")
async def health_check():
    """Health check endpoint для мониторинга контейнера"""
    return {"status": "healthy", "service": "telegram-bot"}


class EventRequest(BaseModel):
    event: str
    data: Dict[str, str]
    tg_id: int
    appointment_id: Optional[int] = None

def verify_api_key(ApiKey: str = Header(...)):
    if ApiKey != settings.api_secret:
        raise HTTPException(status_code=403, detail="Forbidden")

def build_message(event: str, data: dict) -> str:
    if event == "test":
        return (
            "✅ <b>Тестовое сообщение от MedBooker Bot</b>\n\n"
            "Если вы видите это сообщение, значит интеграция с ботом работает корректно!"
        )
    
    if event == "received_message":
        return (
            "📩 <b>Новое сообщение от пользователя</b>\n\n"
            f"👤 ФИО: <b>{data.get('full_name')}</b>\n"
            f"📧 Email: <b>{data.get('email')}</b>\n"
            f"💬 Сообщение:\n<b>{data.get('message')}</b>\n"
        )

    if event == "authorization":
        return (
            "🔐 <b>Авторизация</b>\n\n"

            f"📧 Email: <b>{data.get('email')}</b>\n"
            f"📞 Телефон: <b>{data.get('phone')}</b>\n"
            f"👔 Роль: <b>{data.get('role')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"⏰ Время: <b>{data.get('time')}</b>\n"
        )

    if event == "registration":
        return (
            "🆕 <b>Новая регистрация</b>\n\n"

            f"👤 Пользователь: <b>{data.get('name')}</b>\n"
            f"📞 Телефон: <b>{data.get('phone')}</b>\n"
            f"📧 Email: <b>{data.get('email')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"⏰ Время: <b>{data.get('time')}</b>\n"
        )

    if event == "logout_user":
        return (
            "🚪 <b>Выход из системы</b>\n\n"
            f"👤 Пользователь: <b>{data.get('name')}</b>\n"
            f"📧 Email: <b>{data.get('email')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"⏰ Время: <b>{data.get('time')}</b>\n"
            f"👔 Роль: <b>{data.get('role')}</b>\n"
        )

    if event == "appointment_created_for_clinic":
        return (
            "📋 <b>У вас новая запись</b>\n\n"

            f"👤 Пациент: <b>{data.get('patient_name')}</b>\n"
            f"📞 Телефон: <b>{data.get('phone')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"💬 Комментарий: <b>{data.get('comment')}</b>\n\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n"
        )
    
    if event == "appointment_created_for_client":
        return (
            "📋 <b>Новая запись ожидает подтверждения</b>\n\n"

            f"👤 ФИО: <b>{data.get('patient_name')}</b>\n"
            f"📞 Телефон: <b>{data.get('phone')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"💬 Комментарий: <b>{data.get('comment')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            
            "Ожидайте подтверждения от клиники. ⏳"
        )
    
    if event == "appointment_confirmed_for_client":
        return (
            "✅ <b>Запись подтверждена! 😊</b>\n\n"

            f"👤 ФИО: <b>{data.get('patient_name')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            f"📍 Адрес: <b>{data.get('clinic_address')}</b>\n\n"
            
            "Ждём вас на приём! 😊"
        )
    
    if event == "appointment_status_changed_for_client":
        return (
            "🔄 <b>Статус вашей записи изменён</b>\n\n"

            f"👤 ФИО: <b>{data.get('patient_name')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            f"📍 Адрес: <b>{data.get('clinic_address')}</b>\n"

            "С нетерпением ждём вас на приём! 😊"
        )
    
    if event == "appointment_canceled_for_clinic":
        return (
            "❌ <b>Запись отменена клиникой</b>\n\n"

            f"👤 Пациент: <b>{data.get('patient_name')}</b>\n"
            f"📞 Телефон: <b>{data.get('phone')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            "Если не согласны с отменой, свяжитесь с клиникой."
        )
    
    if event == "appointment_canceled_for_client":
        return (
            "❌ <b>Запись отменена пациентом</b>\n\n"
            
            f"👤 Пациент: <b>{data.get('patient_name')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            
            "Вы можете создать новую запись на сайте."
        )
    
    if event == "appointment_finished_for_client":
        return (
            "✅ <b>Ваш прием завершен</b>\n\n"
            
            f"👤 Пациент: <b>{data.get('patient_name')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            
            "Были рады вас видеть! Надеемся, что вы остались довольны приемом. Приходите еще :)"
        )
    
    if event == "appointment_no_show_for_client":
        return (
            "⚠️ <b>Вы не пришли на приём</b>\n\n"
            
            f"👤 Пациент: <b>{data.get('patient_name')}</b>\n"
            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🛠️ Услуга: <b>{data.get('service')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n\n"
            
            "Если это была ошибка, пожалуйста, свяжитесь с клиникой для повторной записи."
        )
    
    if event == "appointment_reminder":
        return (
            "⏰ <b>Напоминание о приёме</b>\n\n"

            f"📅 Дата: <b>{data.get('date')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n"
            f"📍 Адрес: <b>{data.get('clinic_address')}</b>\n\n"
            
            "До встречи!"
        )
    
    if event == "reminder_2hours":
        return (
            "⏰ <b>Скоро приём!</b>\n\n"

            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n"
            f"📍 Адрес: <b>{data.get('clinic_address')}</b>\n\n"
            
            "Пожелалуйста не опаздывайте!"
        )
    
    if event == "reminder_30min":
        return (
            "🔔 <b>Приём через 30 минут!</b>\n\n"

            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"👨‍⚕️ Врач: <b>{data.get('doctor_name')}</b>\n"
            f"🏥 Клиника: <b>{data.get('clinic_name')}</b>\n"
            f"📍 Адрес: <b>{data.get('clinic_address')}</b>\n\n"
            
            "Пора выходить!"
        )
    
    if event == "status_inviled_display_for_doctor":
        return (
            "<b>Ваш следующий пациент</b>\n\n"

            f"👤 <b>{data.get('patient_name')}</b>\n"
            f"🔢 Номер талона: <b>{data.get('number_coupon')}</b>\n\n"
        )
    
    if event == "status_invited_for_doctor":
        return (
            "📲 <b>Пациент приглашён из очереди</b>\n\n"

            f"👤 <b>{data.get('patient_name')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"🔢 Номер талона: <b>{data.get('number_coupon')}</b>\n\n"
        )

    if event == "status_urgent_for_doctor":
        return (
            "⚠️ <b>Пациент требует срочного внимания</b>\n\n"

            f"👤 <b>{data.get('patient_name')}</b>\n"
            f"🕐 Время: <b>{data.get('time')}</b>\n"
            f"🔢 Номер талона: <b>{data.get('number_coupon')}</b>\n\n"
        )

    return "⚠️ <b>Системная ошибка</b>"


@app.post("/event", dependencies=[Depends(verify_api_key)])
async def handle_event(payload: EventRequest):
    try:
        # Создаем inline keyboard для события приглашения пациента
        keyboard = None
        if payload.event == "status_invited_for_doctor" and payload.appointment_id:
            keyboard = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="✅ Завершить прием",
                            callback_data=f"finish_appointment:{payload.appointment_id}"
                        )
                    ]
                ]
            )
        elif payload.event == "status_inviled_display_for_doctor" and payload.appointment_id:
            keyboard = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="✅ Вызвать пациента",
                            callback_data=f"finish_appointment:{payload.appointment_id}"
                        )
                    ]
                ]
            )
        
        asyncio.create_task(
            send_message(
                payload.tg_id,
                build_message(payload.event, payload.data),
                reply_markup=keyboard
            )
        )

        return {
            "success": True,
            "message": "Сообщение поставлено в очередь"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
