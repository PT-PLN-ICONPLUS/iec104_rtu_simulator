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
    # 100: {
    #     'type': MeasuredValueScaled,
    #     'data': 1,
    #     'callback': None,
    #     'event': False
    # },
    # 101: {
    #     'type': MeasuredValueScaled,
    #     'data': 22,
    #     'callback': None,
    #     'event': True
    # },
    # 102: {
    #     'type': MeasuredValueScaled,
    #     'data': 42,
    #     'callback': None,
    #     'event': False
    # },
    # 200: {
    #     'type': SinglePointInformation,
    #     'data': False,
    #     'callback': None,
    #     'event': False
    # },
    # 300: {
    #     'type': DoublePointInformation,
    #     'data': 1,
    #     'callback': None,
    #     'event': False
    # },
    # 301: {
    #     'type': DoublePointInformation,
    #     'data': 2,
    #     'callback': None,
    #     'event': False
    # },
    # 5000: {
    #     'type': DoubleCommand,
    #     'data': 1,
    #     'callback': None,
    #     'event': False
    # },
    # 5001: {
    #     'type': DoubleCommand,
    #     'data': 2,
    #     'callback': None,
    #     'event': False
    # }
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
    
@sio.event
async def add_telesignal(sid, data):
    logger.info(f'Add Telesignal: {data}')
    ioa = int(data['ioa'])
    name = data['name']
    initial_value = int(data.get('value', 0))
    
    # Add a SinglePointInformation for telesignal
    result = IEC_SERVER.add_ioa(ioa, SinglePointInformation, initial_value, None, True)
    if result == 0:
        await sio.emit('telesignal_added', {
            'ioa': ioa,
            'name': name,
            'value': initial_value
        })
    else:
        await sio.emit('error', {'message': f'Failed to add telesignal IOA {ioa}'})

@sio.event
async def remove_telesignal(sid, data):
    logger.info(f'Remove Telesignal: {data}')
    ioa = int(data['ioa'])
    result = IEC_SERVER.remove_ioa(ioa)
    if result == 0:
        await sio.emit('telesignal_removed', {'ioa': ioa})
    else:
        await sio.emit('error', {'message': f'Failed to remove telesignal IOA {ioa}'})

@sio.event
async def update_telesignal(sid, data):
    logger.info(f'Update Telesignal: {data}')
    ioa = int(data['ioa'])
    if 'value' in data:
        value = int(data['value'])
        IEC_SERVER.update_ioa(ioa, value)
    
    if 'auto_mode' in data:
        # Handle auto mode changes if needed
        auto_mode = data['auto_mode']
        # You may need to store auto_mode state somewhere

@sio.event
async def add_telemetry(sid, data):
    logger.info(f'Add Telemetry: {data}')
    ioa = int(data['ioa'])
    name = data['name']
    initial_value = int(data.get('value', 0))
    unit = data.get('unit', '')
    scale_factor = float(data.get('scale_factor', 1.0))
    
    # Add a MeasuredValueScaled for telemetry
    result = IEC_SERVER.add_ioa(ioa, MeasuredValueScaled, initial_value, None, True)
    if result == 0:
        await sio.emit('telemetry_added', {
            'ioa': ioa,
            'name': name,
            'value': initial_value,
            'unit': unit,
            'scale_factor': scale_factor
        })
    else:
        await sio.emit('error', {'message': f'Failed to add telemetry IOA {ioa}'})

@sio.event
async def remove_telemetry(sid, data):
    logger.info(f'Remove Telemetry: {data}')
    ioa = int(data['ioa'])
    result = IEC_SERVER.remove_ioa(ioa)
    if result == 0:
        await sio.emit('telemetry_removed', {'ioa': ioa})
    else:
        await sio.emit('error', {'message': f'Failed to remove telemetry IOA {ioa}'})

@sio.event
async def update_telemetry(sid, data):
    logger.info(f'Update Telemetry: {data}')
    ioa = int(data['ioa'])
    if 'value' in data:
        value = int(float(data['value']) * 1) # Scale as needed
        IEC_SERVER.update_ioa(ioa, value)
    
    if 'auto_mode' in data:
        # Handle auto mode changes
        pass

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