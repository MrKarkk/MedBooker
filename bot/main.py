import asyncio
import logging
from contextlib import asynccontextmanager
from config import settings
import uvicorn
from fastapi import FastAPI
from bot import start_bot
from api_server import app as api_app


logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s | %(levelname)s | %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    bot_task = asyncio.create_task(start_bot())
    yield
    bot_task.cancel()


api_app.router.lifespan_context = lifespan


def main():
    uvicorn.run(
        api_app,
        host=settings.api_host,
        port=settings.api_port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
