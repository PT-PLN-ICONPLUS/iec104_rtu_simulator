import asyncio
import time
from typing import Dict
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
from data_models import CircuitBreakerItem, TeleSignalItem, TelemetryItem
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from lib.lib60870 import (
    SinglePointInformation,
    MeasuredValueScaled,
    SingleCommand,
    DoubleCommand,
    DoublePointInformation
)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

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

# In-memory storage for items
circuit_breakers: Dict[str, CircuitBreakerItem] = {}
telesignals: Dict[str, TeleSignalItem] = {}
telemetries: Dict[str, TelemetryItem] = {}

IEC_SERVER = IEC60870_5_104_server(
    IEC_SERVER_HOST, 
    IEC_SERVER_PORT, 
    IOA_LIST,
    circuit_breakers=circuit_breakers,
    telesignals=telesignals,
    telemetries=telemetries
)

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@sio.event
async def connect(sid, environ):
    """Handle new connections."""
    logger.info(f"Socket client connected: {sid}")
    
    await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()], room=sid)
    await sio.emit('tele_signals', [item.model_dump() for item in telesignals.values()], room=sid)
    await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()], room=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Socket client disconnected: {sid}")
    
@sio.event
async def get_initial_data(sid):
    """Send initial data to the frontend."""
    try:
        data = {
            "circuit_breakers": [item.model_dump() for item in circuit_breakers.values()],
            "telesignals": [
                {**item.model_dump(), "auto_mode": getattr(item, "auto_mode", True)}
                for item in telesignals.values()
            ],
            "telemetries": [
                {**item.model_dump(), "auto_mode": getattr(item, "auto_mode", True)}
                for item in telemetries.values()
            ],
        }
        await sio.emit('get_initial_data_response', data, room=sid)
        logger.info(f"Initial data sent to {sid}. Data: {data}")
    except Exception as e:
        logger.error(f"Error fetching initial data: {e}")
        await sio.emit('get_initial_data_error', {"error": "Failed to fetch initial data"}, room=sid)
        
def add_circuit_breaker_ioa(item: CircuitBreakerItem):
    """Add IOA for circuit breaker."""
    IEC_SERVER.add_ioa(item.ioa_cb_status, SinglePointInformation, 0, None, True)
    IEC_SERVER.add_ioa(item.ioa_cb_status_close, SinglePointInformation, 0, None, True)
    
    IEC_SERVER.add_ioa(item.ioa_control_open, SingleCommand, 0, None, True)
    IEC_SERVER.add_ioa(item.ioa_control_close, SingleCommand, 0, None, True)

    if item.is_double_point and item.ioa_cb_status_dp:
        IEC_SERVER.add_ioa(item.ioa_cb_status_dp, DoublePointInformation, 0, None, True)
        IEC_SERVER.add_ioa(item.ioa_control_dp, DoubleCommand, 0, None, True)
    
    IEC_SERVER.add_ioa(item.ioa_local_remote, SinglePointInformation, 0, None, True)
    
    logger.info(f"Added circuit breaker: {item.name} with IOA CB status open (for unique value): {item.ioa_cb_status}")
    
    return 0
    
@sio.event
async def add_circuit_breaker(sid, data):
    item = CircuitBreakerItem(**data)
    circuit_breakers[item.id] = item
    
    result = add_circuit_breaker_ioa(item)
    
    if result != 0:
        await sio.emit('error', {'message': f'Failed to add circuit breaker IOA {item.ioa_cb_status}'})
        return {"status": "error", "message": f"Failed to add circuit breaker {item.name}"}
    
    await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
    return {"status": "success", "message": f"Added circuit breaker {item.name}"}
    
@sio.event
async def update_circuit_breaker(sid, data):
    ioa_cb_status = data.get('ioa_cb_status')
    # Find the item by IOA
    for item_id, item in list(circuit_breakers.items()):
        if item.ioa_cb_status == ioa_cb_status:
            # Update remote status if provided
            if 'remote' in data:
                circuit_breakers[item_id].remote = data['remote']
                IEC_SERVER.update_ioa(item.ioa_local_remote, data['remote'])
                
            # Update value if provided
            if 'cb_status_open' in data:
                circuit_breakers[item_id].cb_status_open = data['cb_status_open']
                IEC_SERVER.update_ioa(item.ioa_cb_status, data['cb_status_open'])
                
            if 'cb_status_close' in data:
                circuit_breakers[item_id].cb_status_close = data['cb_status_close']
                IEC_SERVER.update_ioa(item.ioa_cb_status_close, data['cb_status_close'])
                
            if 'cb_status_dp' in data:
                circuit_breakers[item_id].cb_status_dp = data['cb_status_dp']
                IEC_SERVER.update_ioa(item.ioa_cb_status_dp, data['cb_status_dp'])
                
            if 'control_open' in data:
                circuit_breakers[item_id].control_open = data['control_open']
                IEC_SERVER.update_ioa(item.ioa_control_open, data['control_open'])
                
            if 'control_close' in data:
                circuit_breakers[item_id].control_close = data['control_close']
                IEC_SERVER.update_ioa(item.ioa_control_close, data['control_close'])
                
            if 'control_dp' in data:
                circuit_breakers[item_id].control_dp = data['control_dp']
                IEC_SERVER.update_ioa(item.ioa_control_dp, data['control_dp'])
                
            # Handle SBO mode update if provided
            if 'is_sbo' in data:
                circuit_breakers[item_id].is_sbo = data['is_sbo']
                
            # Handle double point mode update if provided
            if 'is_double_point' in data:
                circuit_breakers[item_id].is_double_point = data['is_double_point']
            
            logger.info(f"Updated circuit breaker: {item.name}, data: {circuit_breakers[item_id].model_dump()}")
            # await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
            return {"status": "success"}
    
    return {"status": "error", "message": "Circuit breaker not found"}

@sio.event
async def remove_circuit_breaker(sid, data):
    item_id = data.get('id')
    if item_id and item_id in circuit_breakers:
        item = circuit_breakers.pop(item_id)
        # Remove all ioas from the IEC server
        IEC_SERVER.remove_ioa(item.ioa_cb_status)
        IEC_SERVER.remove_ioa(item.ioa_cb_status_close)
        IEC_SERVER.remove_ioa(item.ioa_control_open)
        IEC_SERVER.remove_ioa(item.ioa_control_close)
        if item.is_double_point and item.ioa_cb_status_dp:
            IEC_SERVER.remove_ioa(item.ioa_cb_status_dp)
            IEC_SERVER.remove_ioa(item.ioa_control_dp)
        IEC_SERVER.remove_ioa(item.ioa_local_remote)
        
        logger.info(f"Removed circuit breaker: {item.name}")
        await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
        return {"status": "success", "message": f"Removed circuit breaker {item.name}"}
    return {"status": "error", "message": "Circuit breaker not found"}
    
@sio.event
async def add_telesignal(sid, data):
    item = TeleSignalItem(**data)
    telesignals[item.id] = item
    
    # Add a SinglePointInformation for telesignal
    result = IEC_SERVER.add_ioa(item.ioa, SinglePointInformation, item.value, None, True)
    if result == 0:
        # Initialize with auto_mode disabled
        IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = False
        await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()])
        return {"status": "success", "message": f"Added telesignal {item.name}"}
    else:
        await sio.emit('error', {'message': f'Failed to add telesignal IOA {item.ioa}'})

@sio.event
async def update_telesignal(sid, data):
    ioa = int(data['ioa'])
    
    # Find the item by IOA
    for item_id, item in list(telesignals.items()):
        if item.ioa == ioa:
            # Update auto_mode if provided
            if 'auto_mode' in data:
                telesignals[item_id].auto_mode = data['auto_mode']
                logger.info(f"Telesignal set auto_mode to {data['auto_mode']} name: {item.name} (IOA: {item.ioa})")
            
            # Update value if provided
            if 'value' in data:
                new_value = data['value']
                telesignals[item_id].value = new_value
                result = IEC_SERVER.update_ioa(ioa, new_value)
                logger.info(f"Telesignal updated: {item.name} (IOA: {item.ioa}) value: {item.value}")
            
            # await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()])
            return {"status": "success"}
    
    return {"status": "error", "message": "Telesignal not found"}

@sio.event
async def remove_telesignal(sid, data):
    item_id = data.get('id')
    if item_id and item_id in telesignals:
        item = telesignals.pop(item_id)
        
        # Remove the IOA from the IEC server
        result = IEC_SERVER.remove_ioa(item.ioa)
        if result != 0:
            await sio.emit('error', {'message': f'Failed to remove telesignal IOA {item.ioa}'})
        
        logger.info(f"Removed telesignal: {item.name}")
        await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()])
        return {"status": "success", "message": f"Removed telesignal {item.name}"}
    return {"status": "error", "message": "Telesignal not found"}

@sio.event
async def add_telemetry(sid, data):
    item = TelemetryItem(**data)
    telemetries[item.id] = item
    # Scale value as needed for integer representation
    scaled_value = int(item.value / item.scale_factor)
    
    result = IEC_SERVER.add_ioa(item.ioa, MeasuredValueScaled, scaled_value, None, True)
    if result == 0:
        # Initialize with auto_mode disabled
        IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = False
        IEC_SERVER.ioa_list[item.ioa]['min_value'] = item.min_value
        IEC_SERVER.ioa_list[item.ioa]['max_value'] = item.max_value
        await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
    else:
        await sio.emit('error', {'message': f'Failed to add telemetry IOA {item.ioa}'})
    
    logger.info(f"Added telemetry: {item.name} with IOA {item.ioa}")
    await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
    return {"status": "success", "message": f"Added telemetry {item.name}"}

@sio.event
async def update_telemetry(sid, data):
    ioa = int(data['ioa'])
    
    # Find the item by IOA
    for item_id, item in list(telemetries.items()):
        if item.ioa == ioa:
            # Update auto_mode if provided
            if 'auto_mode' in data:
                telemetries[item_id].auto_mode = data['auto_mode']
                logger.info(f"Telemetry set auto_mode to {data['auto_mode']} name: {item.name} (IOA: {item.ioa})")
            
            # Update value if provided
            if 'value' in data:
                new_value = data['value']
                telemetries[item_id].value = new_value
                
                result = IEC_SERVER.update_ioa(ioa, new_value)
                if result != 0:
                    await sio.emit('error', {'message': f'Failed to update telemetry IOA {ioa}'})
                
                logger.info(f"Telemetry updated: {item.name} (IOA: {item.ioa}) value: {item.value}")
            
            # await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
            return {"status": "success"}
    
    return {"status": "error", "message": "Telemetry not found"}

@sio.event
async def remove_telemetry(sid, data):
    item_id = data.get('id')
    if item_id and item_id in telemetries:
        item = telemetries.pop(item_id)
        
        # Remove the IOA from the IEC server
        result = IEC_SERVER.remove_ioa(item.ioa)
        if result != 0:
            await sio.emit('error', {'message': f'Failed to remove telemetry IOA {item.ioa}'})
        
        logger.info(f"Removed telemetry: {item.name}")
        await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
        return {"status": "success", "message": f"Removed telemetry {item.name}"}
    return {"status": "error", "message": "Telemetry not found"}
    
@sio.event
async def export_data(sid):
    """Export all data as JSON via socket."""
    try:
        logger.info("Exporting all IOA data via socket")
        data = {
            "circuit_breakers": [item.model_dump() for item in circuit_breakers.values()],
            "telesignals": [item.model_dump() for item in telesignals.values()],
            "telemetries": [item.model_dump() for item in telemetries.values()],
        }
        await sio.emit('export_data_response', data, room=sid)
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        await sio.emit('export_data_error', {"error": "Failed to export data"}, room=sid)

@sio.event
async def import_data(sid, data):
    """Import all data from JSON via socket."""
    try:
        logger.info("Importing data via socket")
        # Clear existing data
        circuit_breakers.clear()
        telesignals.clear()
        telemetries.clear()

        # Populate with new data
        for cb in data.get("circuit_breakers", []):
            item = CircuitBreakerItem(**cb)
            circuit_breakers[item.id] = item
            # Add IOAs to the IEC server
            add_circuit_breaker_ioa(item)

        for ts in data.get("telesignals", []):
            item = TeleSignalItem(**ts)
            telesignals[item.id] = item
            # Add IOAs to the IEC server
            result = IEC_SERVER.add_ioa(item.ioa, SinglePointInformation, item.value, None, True)
            if result == 0:
                # Initialize with auto_mode disabled
                IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = False
                logger.info(f"Added telesignal: {item.name} with IOA {item.ioa}")
            else:
                await sio.emit('error', {'message': f'Failed to add telesignal IOA {item.ioa}'})

        for tm in data.get("telemetries", []):
            item = TelemetryItem(**tm)
            telemetries[item.id] = item
            scaled_value = int(item.value / item.scale_factor)
    
            result = IEC_SERVER.add_ioa(item.ioa, MeasuredValueScaled, scaled_value, None, True)
            if result == 0:
                # Initialize with auto_mode disabled
                IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = False
                IEC_SERVER.ioa_list[item.ioa]['min_value'] = item.min_value
                IEC_SERVER.ioa_list[item.ioa]['max_value'] = item.max_value
                
                logger.info(f"Added telemetry: {item.name} with IOA {item.ioa}")
            else:
                await sio.emit('error', {'message': f'Failed to add telemetry IOA {item.ioa}'})
        
        # Emit updated data to all clients 
        await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()], room=sid)
        await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()], room=sid)
        await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()], room=sid)
        await sio.emit('import_data_response', {"status": "success"}, room=sid)
    except Exception as e:
        logger.error(f"Error importing data: {e}")
        await sio.emit('import_data_error', {"error": "Failed to import data"}, room=sid)
    
async def poll_ioa_values():
    """
    Continuously poll IOA values from the IEC server and send them to frontend clients.
    This function runs as a background task and sends updates every second.
    Also handles auto mode changes for telesignals and telemetry.
    """
    logger.info("Starting IOA polling task")
    
    # Store last update times
    last_update_times = {
        "circuit_breakers": {},
        "telesignals": {},
        "telemetries": {}
    }
    
    while True:
        try:
            current_time = time.time()
            has_updates = {
                "circuit_breakers": False,
                "telesignals": False,
                "telemetries": False
            }
            
            # Simulate circuit breakers in auto mode
            # for item_id, item in list(circuit_breakers.items()):
            #     # Skip if not due for update yet
            #     last_update = last_update_times["circuit_breakers"].get(item_id, 0)
            #     if current_time - last_update < item.interval:
            #         continue
                    
            #     if not item.remote:  # Only change values if not in remote mode
            #         continue
                    
            #     new_value = random.randint(item.min_value, item.max_value)
            #     if new_value != item.value:
            #         circuit_breakers[item_id].value = new_value
            #         IEC_SERVER.update_ioa(item.ioa_data, new_value)
            #         if item.is_double_point and item.ioa_data_dp:
            #             IEC_SERVER.update_ioa(item.ioa_data_dp, new_value)
                        
            #         # Record update time
            #         last_update_times["circuit_breakers"][item_id] = current_time
            #         has_updates["circuit_breakers"] = True
            
            # Simulate telesignals in auto mode
            for item_id, item in list(telesignals.items()):
                # Skip if not due for update yet
                last_update = last_update_times["telesignals"].get(item_id, 0)
                if current_time - last_update < item.interval:
                    continue
                
                # Check if auto mode is enabled
                if not getattr(item, 'auto_mode', True):  # Default to True for backward compatibility
                    continue
                    
                new_value = random.randint(item.min_value, item.max_value)
                if new_value != item.value:
                    telesignals[item_id].value = new_value
                    IEC_SERVER.update_ioa(item.ioa, new_value)
                    
                    # Record update time
                    last_update_times["telesignals"][item_id] = current_time
                    has_updates["telesignals"] = True
            
            # Simulate telemetry in auto mode
            for item_id, item in list(telemetries.items()):
                # Skip if not due for update yet
                last_update = last_update_times["telemetries"].get(item_id, 0)
                if current_time - last_update < item.interval:
                    continue
                    
                # Check if auto mode is enabled
                if not getattr(item, 'auto_mode', True):  # Default to True for backward compatibility
                    continue
                    
                new_value = random.uniform(item.min_value, item.max_value)
                telemetries[item_id].value = round(new_value, 2)
                scaled_value = int(new_value / item.scale_factor)
                IEC_SERVER.update_ioa(item.ioa, scaled_value)
                
                logger.info(f"Telemetry auto-updated: {item.name} (IOA: {item.ioa}) value: {telemetries[item_id].value}")
                
                # Record update time
                last_update_times["telemetries"][item_id] = current_time
                has_updates["telemetries"] = True
                
            # Broadcast updates only if there were changes
            if has_updates["circuit_breakers"] and circuit_breakers:
                await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
            if has_updates["telesignals"] and telesignals:
                await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()])
            if has_updates["telemetries"] and telemetries:
                await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
                
            # Use a shorter sleep time to check more frequently, but not burn CPU
            await asyncio.sleep(0.1)
            
        except Exception as e:
            logger.error(f"Error in IOA polling task: {str(e)}")
            await asyncio.sleep(3)  # Wait before retrying if there's an error

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
    finally:
        IEC_SERVER.stop()
        logger.info("IEC 60870-5-104 server stopped successfully")
        logger.info("Application shutdown")
    
app = FastAPI(lifespan=lifespan)
socket_app = socketio.ASGIApp(sio, app)

# Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    uvicorn.run(socket_app, host=FASTAPI_HOST, port=FASTAPI_PORT)