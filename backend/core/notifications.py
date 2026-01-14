import requests
import threading
import logging
import backend.settings as settings


logger = logging.getLogger(__name__)

API_URL = getattr(settings, 'BOT_SERVICE_URL', None)
API_KEY = getattr(settings, 'BOT_API_SECRET', None)


def _post_event(payload: dict):
    try:
        resp = requests.post(
            f"{API_URL}/event",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "ApiKey": API_KEY
            },
            timeout=3
        )
        if resp.status_code >= 400:
            logger.warning(f"Notification failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.warning(f"Notification error: {e}")


def _send_event(payload: dict):
    tg = payload.get('tg_id')

    # Если tg_id — список, отправляем отдельные запросы по каждому id
    if isinstance(tg, (list, tuple)):
        for chat_id in tg:
            try:
                chat_id_int = int(chat_id)
            except Exception:
                continue
            p = payload.copy()
            p['tg_id'] = chat_id_int
            _post_event(p)
    else:
        try:
            if tg is not None:
                payload['tg_id'] = int(tg)
        except Exception:
            pass
        _post_event(payload)


def send_event_async(payload: dict):
    thread = threading.Thread(
        target=_send_event,
        args=(payload,),
        daemon=True
    )
    thread.start()