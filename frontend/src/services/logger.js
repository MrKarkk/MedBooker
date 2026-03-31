/**
 * Сервис логирования фронтенда.
 * Отправляет логи на бэкенд POST /api/core/log/ → записывается в react.log.
 * В режиме разработки дополнительно выводит в консоль.
 *
 * Использование:
 *   import logger from '@/services/logger';
 *   logger.info('Пользователь открыл страницу');
 *   logger.error('Не удалось загрузить данные', { status: 500 });
 */

import apiClient from './axios';

/**
 * Основная функция отправки лога.
 * @param {'DEBUG'|'INFO'|'WARNING'|'ERROR'|'CRITICAL'} level
 * @param {string} message
 * @param {Object} [extra]
 */
const send = (level, message, extra = undefined) => {
    const payload = {
        level,
        message: String(message),
        page: window.location.pathname + window.location.search,
        ...(extra !== undefined && { extra }),
    };

    // fire-and-forget: не блокируем и не кидаем ошибку наружу
    apiClient.post('/core/log/', payload).catch(() => {
        // Намеренно игнорируем — логирование не должно ломать приложение
    });
};

const logger = {
    debug:    (msg, extra) => send('WARNING', msg, extra),
    info:     (msg, extra) => send('WARNING', msg, extra),
    warning:  (msg, extra) => send('WARNING', msg, extra),
    warn:     (msg, extra) => send('WARNING', msg, extra),
    error:    (msg, extra) => send('WARNING', msg, extra),
    critical: (msg, extra) => send('WARNING', msg, extra),
};

export default logger;
