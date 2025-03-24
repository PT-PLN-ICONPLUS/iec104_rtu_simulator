from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn
from dotenv import load_dotenv
import os
from lib.libiec60870server import IEC60870_5_104_server
import logging
from lib.lib60870 import *

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

FASTAPI_HOST = os.getenv("FASTAPI_HOST")
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT"))

IEC_SERVER_HOST = os.getenv("IEC_104_SERVER_HOST")
IEC_SERVER_PORT = int(os.getenv("IEC_104_SERVER_PORT"))

IOA_LIST = {
    100: {
        'type': MeasuredValueScaled,
        'data': 1,
        'callback': None,
        'event': False
    },
    101: {
        'type': MeasuredValueScaled,
        'data': 22,
        'callback': None,
        'event': True
    },
    102: {
        'type': MeasuredValueScaled,
        'data': 42,
        'callback': None,
        'event': False
    },
    200: {
        'type': SinglePointInformation,
        'data': False,
        'callback': None,
        'event': False
    },
    300: {
        'type': DoublePointInformation,
        'data': 1,
        'callback': None,
        'event': False
    },
    301: {
        'type': DoublePointInformation,
        'data': 2,
        'callback': None,
        'event': False
    },
    5000: {
        'type': DoubleCommand,
        'data': 1,
        'callback': None,
        'event': False
    },
    5001: {
        'type': DoubleCommand,
        'data': 2,
        'callback': None,
        'event': False
    }
}

IEC_SERVER = IEC60870_5_104_server(IEC_SERVER_HOST, IEC_SERVER_PORT, IOA_LIST)

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO SOCKETS
@sio.event
async def connect(sid, environ):
    logger.info(f"Socket client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Socket client disconnected: {sid}")

# TODO ASYNC CONTEXT MANAGER
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup")
    
    start_result = IEC_SERVER.start()
    if start_result == 0:
        logger.info("IEC 60870-5-104 server started successfully")
    else:
        logger.error("Failed to start IEC 60870-5-104 server")
    
    yield  
    
    IEC_SERVER.stop()
    logger.info("IEC 60870-5-104 server stopped successfully")
    logger.info("Application shutdown")
    
app = FastAPI(lifespan=lifespan)
socket_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    uvicorn.run(socket_app, host=FASTAPI_HOST, port=FASTAPI_PORT)