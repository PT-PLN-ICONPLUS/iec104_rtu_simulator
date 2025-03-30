import asyncio
import time
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn
from dotenv import load_dotenv
import os
from lib.libiec60870server import IEC60870_5_104_server
import logging
import random

from lib.lib60870 import (
    SinglePointInformation,
    MeasuredValueScaled,
    SingleCommand,
    DoubleCommand,
    DoublePointInformation
)

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
    """Handle new connections."""
    logger.info(f"Client connected: {sid}")
    
    # Send all current IOA values to the new client
    ioa_data = {}
    for ioa, item in IEC_SERVER.ioa_list.items():
        if item['type'] == MeasuredValueScaled:
            ioa_type = 'telemetry'
        elif item['type'] == SinglePointInformation:
            ioa_type = 'telesignal'
        else:
            ioa_type = 'unknown'
            
        ioa_data[ioa] = {
            'ioa': ioa,
            'value': item['data'],
            'type': ioa_type,
            'auto_mode': item.get('auto_mode', False)
        }
    
    await sio.emit('ioa_values', ioa_data, room=sid)

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
        # Initialize with auto_mode disabled
        IEC_SERVER.ioa_list[ioa]['auto_mode'] = False
        await sio.emit('telesignal_added', {
            'ioa': ioa,
            'name': name,
            'value': initial_value,
            'auto_mode': False
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
    
    # Handle value update if provided
    if 'value' in data:
        value = int(data['value'])
        result = IEC_SERVER.update_ioa(ioa, value)

        if result != 0:
            await sio.emit('error', {'message': f'Failed to update telesignal IOA {ioa}'})
        else:
            logger.info(f'Telesignal Updated!: {data}')
            await sio.emit('telesignal_updated', {'ioa': ioa, 'value': value})
    
    # Handle auto mode update if provided
    if 'auto_mode' in data:
        auto_mode = data['auto_mode']
        # Store auto_mode in the IOA list
        if ioa in IEC_SERVER.ioa_list:
            IEC_SERVER.ioa_list[ioa]['auto_mode'] = auto_mode
            logger.info(f'Auto mode for telesignal {ioa} set to: {auto_mode}')
            # Send confirmation to clients
            await sio.emit('telesignal_automode_updated', {'ioa': ioa, 'auto_mode': auto_mode})

@sio.event
async def add_telemetry(sid, data):
    logger.info(f'Add Telemetry: {data}')
    ioa = int(data['ioa'])
    name = data['name']
    initial_value = int(float(data.get('value', 0)))
    unit = data.get('unit', '')
    scale_factor = float(data.get('scale_factor', 1.0))
    min_value = float(data.get('min_value', 0))
    max_value = float(data.get('max_value', 100))
    
    # Add a MeasuredValueScaled for telemetry
    result = IEC_SERVER.add_ioa(ioa, MeasuredValueScaled, initial_value, None, True)
    if result == 0:
        # Initialize with auto_mode disabled and store min/max values
        IEC_SERVER.ioa_list[ioa]['auto_mode'] = False
        IEC_SERVER.ioa_list[ioa]['min_value'] = min_value
        IEC_SERVER.ioa_list[ioa]['max_value'] = max_value
        await sio.emit('telemetry_added', {
            'ioa': ioa,
            'name': name,
            'value': initial_value,
            'unit': unit,
            'scale_factor': scale_factor,
            'min_value': min_value,
            'max_value': max_value,
            'auto_mode': False
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
    
    # Handle value update if provided
    if 'value' in data:
        value = int(float(data['value']))  # Convert to int as required by IEC server
        result = IEC_SERVER.update_ioa(ioa, value)
        if result != 0:
            await sio.emit('error', {'message': f'Failed to update telemetry IOA {ioa}'})
        else:
            logger.info(f'Telemetry Updated!: {data}')
            await sio.emit('telemetry_updated', {'ioa': ioa, 'value': value})
    
    # Handle auto mode update if provided
    if 'auto_mode' in data:
        auto_mode = data['auto_mode']
        # Store auto_mode in the IOA list
        if ioa in IEC_SERVER.ioa_list:
            IEC_SERVER.ioa_list[ioa]['auto_mode'] = auto_mode
            
            # If auto mode is enabled, store min/max values for telemetry
            if 'min_value' in data:
                IEC_SERVER.ioa_list[ioa]['min_value'] = float(data['min_value'])
            if 'max_value' in data:
                IEC_SERVER.ioa_list[ioa]['max_value'] = float(data['max_value'])
                
            logger.info(f'Auto mode for telemetry {ioa} set to: {auto_mode}')
            # Send confirmation to clients
            await sio.emit('telemetry_automode_updated', {'ioa': ioa, 'auto_mode': auto_mode})
    
async def poll_ioa_values():
    """
    Continuously poll IOA values from the IEC server and send them to frontend clients.
    This function runs as a background task and sends updates every second.
    Also handles auto mode changes for telesignals and telemetry.
    """
    logger.info("Starting IOA polling task")
    
    # Store last update times
    last_updates = {}
    
    while True:
        try:
            # Create an empty dictionary to hold all current IOA values
            ioa_data = {}
            current_time = time.time()
            
            # Process auto mode for each IOA
            for ioa, item in IEC_SERVER.ioa_list.items():
                value = item['data']
                auto_mode = item.get('auto_mode', False)
                interval = item.get('interval', 1)  # Default interval of 1 second

                # Initialize ioa_type before conditional blocks
                if item['type'] == MeasuredValueScaled:
                    ioa_type = 'telemetry'
                elif item['type'] == SinglePointInformation:
                    ioa_type = 'telesignal'
                else:
                    ioa_type = 'unknown'

                if auto_mode and (ioa not in last_updates or (current_time - last_updates.get(ioa, 0)) >= interval):

                    # Determine type based on item['type']
                    if item['type'] == MeasuredValueScaled:
                        # Handle auto mode for telemetry - gradually change values
                        if auto_mode:
                            # Get min and max values (if available, otherwise use defaults)
                            min_value = item.get('min_value', 0)
                            max_value = item.get('max_value', 100)
                            scale_factor = item.get('scale_factor', 1.0)
                            
                            # Calculate precision based on scale factor
                            if scale_factor >= 1:
                                precision = 0
                            else:
                                # Count decimal places in scale factor (e.g., 0.01 has 2 decimal places)
                                precision = len(str(scale_factor).split('.')[-1].rstrip('0')) if '.' in str(scale_factor) else 0
                            
                            # Generate a random value between min_value and max_value with appropriate precision
                            new_value = round(random.uniform(min_value, max_value), precision)
                            
                            # Optional: Sometimes make smaller changes to avoid jumping too much
                            if random.random() > 0.2:  # 80% of the time, make smaller changes
                                # Make a change of up to 10% of the range
                                max_change = 0.1 * (max_value - min_value)
                                change = round(random.uniform(-max_change, max_change), precision)
                                new_value = round(max(min_value, min(max_value, value + change)), precision)
                                
                            # Update the value in the IEC server
                            IEC_SERVER.update_ioa(ioa, int(new_value))
                            value = int(new_value)  # Update for the response
                            
                            last_updates[ioa] = current_time
                            
                    elif item['type'] == SinglePointInformation:
                        # Handle auto mode for telesignal - randomly toggle state
                        if auto_mode:  # 10% chance to toggle each poll
                            new_value = 1 if value == 0 else 0
                            IEC_SERVER.update_ioa(ioa, new_value)
                            value = new_value  # Update the value for the response
                            
                            last_updates[ioa] = current_time
                    
                ioa_data[ioa] = {
                    'ioa': ioa,
                    'value': value,
                    'type': ioa_type,
                    'auto_mode': auto_mode
                }
            
            logger.info(f"Sending IOA values: {ioa_data}")
            await sio.emit('ioa_values', ioa_data)
            
            # Short sleep to avoid CPU overload (still check frequently)
            await asyncio.sleep(0.1)
            
        except Exception as e:
            logger.error(f"Error in IOA polling task: {str(e)}")
            await asyncio.sleep(3)  # Wait before retrying if there's an error

# TODO ASYNC CONTEXT MANAGER
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup")
    
    start_result = IEC_SERVER.start()
    if start_result == 0:
        logger.info("IEC 60870-5-104 server started successfully")
    else:
        logger.error("Failed to start IEC 60870-5-104 server")
        
    # Start the IOA polling task
    polling_task = asyncio.create_task(poll_ioa_values())
    
    yield 
    
    # Cancel the polling task when shutting down
    polling_task.cancel()
    try:
        await polling_task
    except asyncio.CancelledError:
        logger.info("IOA polling task cancelled") 
    
    IEC_SERVER.stop()
    logger.info("IEC 60870-5-104 server stopped successfully")
    logger.info("Application shutdown")
    
app = FastAPI(lifespan=lifespan)
socket_app = socketio.ASGIApp(sio, app)

# Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    uvicorn.run(socket_app, host=FASTAPI_HOST, port=FASTAPI_PORT)