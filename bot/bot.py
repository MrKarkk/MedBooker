import logging
import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from config import settings


# Логирование
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


# Бот и диспетчер
bot = Bot(
    token=settings.telegram_bot_token,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)

dp = Dispatcher()


# /start
@dp.message(Command("start"))
async def start(message: Message):
    text = f"""
👋 <b>Привет!</b>
Я буду отправлять вам уведомления о:

• 📅 Записях на приём
• ✅ Подтверждении записей
• ⏰ Напоминаниях о приёмах
• 🔔 Важных обновлениях

<b>Ваш Telegram ID:</b> <code>{message.from_user.id}</code>

<b>Как начать получать уведомления:</b>
1. Скопируйте ваш Telegram ID (нажмите на него выше)
2. Войдите на сайт MedBooker
3. В профиле/настройках вставьте ID в поле "Telegram ID"
4. Сохраните - готово!

<b>Команды:</b>
/help - справка
/status - показать ваш ID
"""
    await message.answer(text)


# /help
@dp.message(Command("help"))
async def help_cmd(message: Message):
    await message.answer("""
        <b>Справка</b>

/start - начать работу и узнать свой ID
/help - эта справка
/status - показать ваш Telegram ID

<b>Как подключить уведомления:</b>
1. Узнайте свой ID командой /start
2. Скопируйте его
3. На сайте в профиле добавьте ID
4. Сохраните

После этого вы будете получать все уведомления! """)


# /status
@dp.message(Command("status"))
async def status(message: Message):
    await message.answer(f"Ваш Telegram ID: <code>{message.from_user.id}</code>")


# Обработка callback "Завершить прием"
@dp.callback_query(F.data.startswith("finish_appointment:"))
async def handle_finish_appointment(callback: CallbackQuery):
    try:
        # Извлекаем ID записи из callback_data
        appointment_id = callback.data.split(":")[1]
        
        logger.info(f"Завершение приема для записи ID: {appointment_id}")
        
        # Отправляем PATCH запрос на бэкенд для изменения статуса
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{settings.backend_url}/appointment/change/{appointment_id}/",
                json={"status": "finished"},
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
        
        if response.status_code == 200:
            data = response.json()
            
            # Редактируем текущее сообщение
            await callback.message.edit_text(
                callback.message.text + "\n\n✅ <b>Прием завершен</b>"
            )
            await callback.answer("✅ Прием завершен", show_alert=False)
            
            # Проверяем, есть ли следующий пациент в очереди
            if data.get('next_appointment_id'):
                next_apt = data.get('next_appointment', {})
                next_text = (
                    "<b>Ваш следующий пациент</b>\n\n"
                    f"👤 Пациент: <b>{next_apt.get('patient_name', 'Не указано')}</b>\n"
                    f"🔢 Талон: <b>{next_apt.get('number_coupon', 'Не указано')}</b>\n"
                    f"🕐 Время: <b>{next_apt.get('time_start', 'Не указано')}</b>\n"
                )
                
                # Создаем кнопку "Вызвать пациента"
                keyboard = InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="📲 Вызвать пациента",
                                callback_data=f"invite_patient:{data['next_appointment_id']}"
                            )
                        ]
                    ]
                )
                
                # Отправляем новое сообщение со следующим пациентом
                await callback.message.answer(next_text, reply_markup=keyboard)
            else:
                await callback.message.answer("✅ Очередь пуста. Нет ожидающих пациентов.")
        else:
            logger.error(f"Ошибка при завершении приема: {response.status_code} - {response.text}")
            await callback.answer("❌ Ошибка обновления статуса", show_alert=True)
            
    except Exception as e:
        logger.error(f"Ошибка при завершении приема: {e}", exc_info=True)
        await callback.answer("❌ Произошла ошибка", show_alert=True)


# Обработка callback "Вызвать пациента"
@dp.callback_query(F.data.startswith("invite_patient:"))
async def handle_invite_patient(callback: CallbackQuery):
    try:
        # Извлекаем ID записи из callback_data
        appointment_id = callback.data.split(":")[1]
        
        logger.info(f"Вызов пациента для записи ID: {appointment_id}")
        
        # Отправляем PATCH запрос на изменение статуса на "invited"
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{settings.backend_url}/appointment/change/{appointment_id}/",
                json={"status": "invited"},
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
        
        if response.status_code == 200:
            # Редактируем сообщение, убирая кнопку
            await callback.message.edit_text(
                callback.message.text + "\n\n📲 <b>Пациент приглашен</b>"
            )
            await callback.answer("✅ Пациент приглашен", show_alert=False)
            
            # Событие status_invited_for_doctor будет отправлено автоматически 
            # из backend при изменении статуса на "invited"
        else:
            logger.error(f"Ошибка при вызове пациента: {response.status_code} - {response.text}")
            await callback.answer("❌ Ошибка при вызове пациента", show_alert=True)
            
    except Exception as e:
        logger.error(f"Ошибка при вызове пациента: {e}", exc_info=True)
        await callback.answer("❌ Произошла ошибка", show_alert=True)


# Любой текст
@dp.message(F.text)
async def echo(message: Message):
    await message.answer("🤖 Я понимаю только команды. Напиши /help")


async def send_message(telegram_id: int, text: str, reply_markup=None):
    """Отправка сообщения пользователю"""
    await bot.send_message(chat_id=telegram_id, text=text, reply_markup=reply_markup)


async def start_bot():
    logger.info("🚀 Бот запущен")
    await dp.start_polling(bot)
