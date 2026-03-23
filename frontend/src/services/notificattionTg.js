import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from '../config';


export const sendNotification = async (full_name, email, message) => {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const textMessage = `
📩 <b>Новое сообщение</b>

👤 <b>ФИО:</b> ${full_name}
📱 <b>Email:</b> ${email}

💬 <b>Сообщение:</b>
${message}

🔗 <b>URL:</b> ${window.location.href}
`.trim();

        const response = await fetch(url, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                chat_id: TELEGRAM_CHAT_ID,

                text: textMessage,

                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();

        if (data.ok) {
            return true;
        } else {
            console.error('❌ Telegram ошибка:', data.description);
            return false;
        }

    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        return false;
    }
};