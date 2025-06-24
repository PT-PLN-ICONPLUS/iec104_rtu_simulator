import asyncio
import math
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
from data_models import CircuitBreakerItem, TeleSignalItem, TelemetryItem, TapChangerItem
from lib.lib60870 import (
    SinglePointInformation,
    MeasuredValueScaled,
    SingleCommand,
    DoubleCommand,
    DoublePointInformation,
    MeasuredValueShort
)
from functools import partial

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

IOA_LIST = {}

# In-memory storage for items
circuit_breakers: Dict[str, CircuitBreakerItem] = {}
telesignals: Dict[str, TeleSignalItem] = {}
telemetries: Dict[str, TelemetryItem] = {}
tap_changers: Dict[str, TapChangerItem] = {}

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

IEC_SERVER = IEC60870_5_104_server(
    IEC_SERVER_HOST, 
    IEC_SERVER_PORT, 
    IOA_LIST,
    socketio_server=sio,
    circuit_breakers=circuit_breakers,
    telesignals=telesignals,
    telemetries=telemetries,
    tap_changers=tap_changers, 
)

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
    await sio.emit('tap_changers', [item.model_dump() for item in tap_changers.values()], room=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Socket client disconnected: {sid}")
    
@sio.event
async def get_initial_data(sid):
    """Send initial data to the frontend."""
    try:
        data = {
            "circuit_breakers": [item.model_dump() for item in circuit_breakers.values()],
            "telesignals": [item.model_dump() for item in telesignals.values()],
            "telemetries": [item.model_dump() for item in telemetries.values()],
            "tap_changers": [item.model_dump() for item in tap_changers.values()],
        }
        await sio.emit('get_initial_data_response', data, room=sid)
        logger.info(f"Initial data sent to {sid}. Data: {data}")
    except Exception as e:
        logger.error(f"Error fetching initial data: {e}")
        await sio.emit('get_initial_data_error', {"error": "Failed to fetch initial data"}, room=sid)
        
def add_circuit_breaker_ioa(item: CircuitBreakerItem):
    
    callback = lambda ioa, ioa_object, server, is_select=None: (
        server.update_ioa_from_server(ioa, ioa_object['data']) 
        if not is_select else True
    )
    
    """Add IOA for circuit breaker."""
    IEC_SERVER.add_ioa(item.ioa_cb_status, SinglePointInformation, 0, callback, True)
    IEC_SERVER.add_ioa(item.ioa_cb_status_close, SinglePointInformation, 0, callback, True)
    
    IEC_SERVER.add_ioa(item.ioa_control_open, SingleCommand, 0, callback, True)
    IEC_SERVER.add_ioa(item.ioa_control_close, SingleCommand, 0, callback, True)

    if item.has_double_point:
        # Check if IOA values are not None before adding them
        if item.ioa_cb_status_dp is not None:
            IEC_SERVER.add_ioa(item.ioa_cb_status_dp, DoublePointInformation, 0, callback, True)
        if item.ioa_control_dp is not None:
            IEC_SERVER.add_ioa(item.ioa_control_dp, DoubleCommand, 0, callback, True)
    
    IEC_SERVER.add_ioa(item.ioa_local_remote_sp, SinglePointInformation, 0, callback, True)
    if item.has_local_remote_dp:
        IEC_SERVER.add_ioa(item.ioa_local_remote_dp, DoublePointInformation, 0, callback, True)
    
    logger.info(f"Added circuit breaker: {item.name} with IOA CB status open (for unique value): {item.id}")
    
    return 0
    
@sio.event
async def add_circuit_breaker(sid, data):
    item = CircuitBreakerItem(**data)
    circuit_breakers[item.id] = item
    
    result = add_circuit_breaker_ioa(item)
    
    if result != 0:
        await sio.emit('error', {'message': f'Failed to add circuit breaker {item.name}'})
        return {"status": "error", "message": f"Failed to add circuit breaker {item.name}"}
    
    await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
    return {"status": "success", "message": f"Added circuit breaker {item.name}"}
    
@sio.event
async def update_circuit_breaker(sid, data):
    id = data.get('id')
    # Find the item by ID
    for item_id, item in list(circuit_breakers.items()):
        if id == item_id:
            ioa_changes = {}
            for ioa_key in ['ioa_cb_status', 'ioa_cb_status_close', 'ioa_control_open', 
                           'ioa_control_close', 'ioa_local_remote_sp', 'ioa_local_remote_dp', 
                           'ioa_cb_status_dp', 'ioa_control_dp']:
                if ioa_key in data and getattr(item, ioa_key, None) != data.get(ioa_key):
                    ioa_changes[ioa_key] = (getattr(item, ioa_key), data.get(ioa_key))
            
            # If there are IOA changes, we need to remove old IOAs and add new ones
            if ioa_changes:
                # First, remove all old IOAs
                IEC_SERVER.remove_ioa(item.ioa_cb_status)
                IEC_SERVER.remove_ioa(item.ioa_cb_status_close)
                IEC_SERVER.remove_ioa(item.ioa_control_open)
                IEC_SERVER.remove_ioa(item.ioa_control_close)
                IEC_SERVER.remove_ioa(item.ioa_local_remote_sp)
                
                if item.has_double_point:
                    if item.ioa_cb_status_dp:
                        IEC_SERVER.remove_ioa(item.ioa_cb_status_dp)
                    if item.ioa_control_dp:
                        IEC_SERVER.remove_ioa(item.ioa_control_dp)
                        
                if item.has_local_remote_dp:
                    IEC_SERVER.remove_ioa(item.ioa_local_remote_dp)
                
                # Update all data fields
                for key, value in data.items():
                    if hasattr(circuit_breakers[item_id], key) and key != 'id':
                        setattr(circuit_breakers[item_id], key, value)
                
                # Add new IOAs with updated configuration
                add_circuit_breaker_ioa(circuit_breakers[item_id])
            else:
                # No IOA changes, just update fields and IOA values
                for key, value in data.items():
                    if hasattr(circuit_breakers[item_id], key) and key != 'id':
                        setattr(circuit_breakers[item_id], key, value)
                        
                        # Update IEC server if this is an IOA-related field value
                        if key == 'remote_sp':
                            IEC_SERVER.update_ioa(item.ioa_local_remote_sp, value)
                        elif key == 'remote_dp':
                            IEC_SERVER.update_ioa(item.ioa_local_remote_dp, value)
                        elif key == 'cb_status_open':
                            IEC_SERVER.update_ioa(item.ioa_cb_status, value)
                        elif key == 'cb_status_close':
                            IEC_SERVER.update_ioa(item.ioa_cb_status_close, value)
                        elif key == 'cb_status_dp':
                            IEC_SERVER.update_ioa(item.ioa_cb_status_dp, value)
                        elif key == 'control_open':
                            IEC_SERVER.update_ioa(item.ioa_control_open, value)
                        elif key == 'control_close':
                            IEC_SERVER.update_ioa(item.ioa_control_close, value)
                        elif key == 'control_dp':
                            IEC_SERVER.update_ioa(item.ioa_control_dp, value)
            
            logger.info(f"Updated circuit breaker: {item.name}, data: {circuit_breakers[item_id].model_dump()}")
            await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
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
        if item.has_double_point:
            if item.ioa_cb_status_dp is not None:
                IEC_SERVER.remove_ioa(item.ioa_cb_status_dp)
            if item.ioa_control_dp is not None:
                IEC_SERVER.remove_ioa(item.ioa_control_dp)
        IEC_SERVER.remove_ioa(item.ioa_local_remote_sp)
        if item.has_local_remote_dp:
            IEC_SERVER.remove_ioa(item.ioa_local_remote_dp)
        
        logger.info(f"Removed circuit breaker: {item.name}")
        await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
        return {"status": "success", "message": f"Removed circuit breaker {item.name}"}
    return {"status": "error", "message": "Circuit breaker not found"}
    
@sio.event
async def add_telesignal(sid, data):
    item = TeleSignalItem(**data)
    telesignals[item.id] = item
    
    callback = lambda ioa, ioa_object, server, is_select=None: (
        server.update_ioa_from_server(ioa, ioa_object['data']) 
        if not is_select else True
    )
    
    # Add a SinglePointInformation for telesignal
    result = IEC_SERVER.add_ioa(item.ioa, SinglePointInformation, item.value, callback, True)
    if result == 0:
        # Initialize with auto_mode disabled
        IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = data.get('auto_mode', False)
        await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()])
        return {"status": "success", "message": f"Added telesignal {item.name}"}
    else:
        await sio.emit('error', {'message': f'Failed to add telesignal IOA {item.ioa}'})

@sio.event
async def update_telesignal(sid, data):
    id = data.get('id')
    # Find the item by ID
    for item_id, item in list(telesignals.items()):
        if id == item_id:
            # Check if IOA is being updated
            old_ioa = item.ioa
            new_ioa = data.get('ioa')
            
            # Handle IOA update if needed
            if new_ioa is not None and old_ioa != new_ioa:
                # Remove old IOA
                IEC_SERVER.remove_ioa(old_ioa)
                
                # Add new IOA
                callback = lambda ioa, ioa_object, server, is_select=None: (
                    server.update_ioa_from_server(ioa, ioa_object['data']) 
                    if not is_select else True
                )
                
                result = IEC_SERVER.add_ioa(new_ioa, SinglePointInformation, item.value, callback, True)
                if result != 0:
                    await sio.emit('error', {'message': f'Failed to update telesignal IOA to {new_ioa}'})
                    return {"status": "error", "message": f"Failed to update IOA to {new_ioa}"}
                
                # Update auto_mode for new IOA
                IEC_SERVER.ioa_list[new_ioa]['auto_mode'] = item.auto_mode
            
            # Update all fields that are provided in the data
            for key, value in data.items():
                if hasattr(telesignals[item_id], key) and key != 'id':
                    setattr(telesignals[item_id], key, value)
                    
                    # Update IEC server for the IOA value
                    if key == 'value':
                        IEC_SERVER.update_ioa(item.ioa, value)
            
            logger.info(f"Updated telesignal: {item.name}, data: {telesignals[item_id].model_dump()}")
            await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()])
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
    
    # Determine type based on scale factor
    if item.scale_factor >= 1:
        # Use MeasuredValueScaled for integer or larger scale factors
        value_type = MeasuredValueScaled
        # Scale value as needed for integer representation
        scaled_value = int(item.value / item.scale_factor)
    else:
        # Use MeasuredValueShort for decimal scale factors for better precision
        value_type = MeasuredValueShort
        # Use actual value for MeasuredValueShort (float)
        scaled_value = item.value

    callback = lambda ioa, ioa_object, server, is_select=None: (
        server.update_ioa_from_server(ioa, ioa_object['data']) 
        if not is_select else True
    )
    
    result = IEC_SERVER.add_ioa(item.ioa, value_type, scaled_value, callback, True)
    if result == 0:
        # Initialize with auto_mode disabled
        IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = False
        IEC_SERVER.ioa_list[item.ioa]['min_value'] = item.min_value
        IEC_SERVER.ioa_list[item.ioa]['max_value'] = item.max_value
        IEC_SERVER.ioa_list[item.ioa]['scale_factor'] = item.scale_factor  # Store scale factor for reference
        IEC_SERVER.ioa_list[item.ioa]['value_type'] = value_type.__name__  # Store type name for reference
        await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
    else:
        await sio.emit('error', {'message': f'Failed to add telemetry IOA {item.ioa}'})
    
    logger.info(f"Added telemetry: {item.name} with IOA {item.ioa} using {value_type.__name__}")
    await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
    return {"status": "success", "message": f"Added telemetry {item.name}"}

@sio.event
async def update_telemetry(sid, data):
    id = data.get('id')
    # If we have an ID, update by ID
    if id:
        for item_id, item in list(telemetries.items()):
            if id == item_id:
                # Check if IOA is being updated
                old_ioa = item.ioa
                new_ioa = data.get('ioa')
                
                # Handle IOA update if needed
                if new_ioa is not None and old_ioa != new_ioa:
                    # Remove old IOA
                    IEC_SERVER.remove_ioa(old_ioa)
                    
                    # Determine type based on scale factor
                    scale_factor = data.get('scale_factor', item.scale_factor)
                    if scale_factor >= 1:
                        # Use MeasuredValueScaled for integer or larger scale factors
                        value_type = MeasuredValueScaled
                        # Scale value as needed for integer representation
                        scaled_value = int(item.value / scale_factor)
                    else:
                        # Use MeasuredValueShort for decimal scale factors for better precision
                        value_type = MeasuredValueShort
                        # Use actual value for MeasuredValueShort (float)
                        scaled_value = item.value
                    
                    # Add new IOA
                    callback = lambda ioa, ioa_object, server, is_select=None: (
                        server.update_ioa_from_server(ioa, ioa_object['data']) 
                        if not is_select else True
                    )
                    
                    result = IEC_SERVER.add_ioa(new_ioa, value_type, scaled_value, callback, True)
                    if result != 0:
                        await sio.emit('error', {'message': f'Failed to update telemetry IOA to {new_ioa}'})
                        return {"status": "error", "message": f"Failed to update IOA to {new_ioa}"}
                    
                    # Update auto_mode and other metadata for new IOA
                    IEC_SERVER.ioa_list[new_ioa]['auto_mode'] = item.auto_mode
                    IEC_SERVER.ioa_list[new_ioa]['min_value'] = item.min_value
                    IEC_SERVER.ioa_list[new_ioa]['max_value'] = item.max_value
                    IEC_SERVER.ioa_list[new_ioa]['scale_factor'] = scale_factor
                    IEC_SERVER.ioa_list[new_ioa]['value_type'] = value_type.__name__
                
                # Update all fields that are provided in the data
                for key, value in data.items():
                    if hasattr(telemetries[item_id], key) and key != 'id':
                        setattr(telemetries[item_id], key, value)
                        
                        # Update IEC server for the IOA value
                        if key == 'value':
                            # Get the value type from IOA list
                            value_type = IEC_SERVER.ioa_list.get(item.ioa, {}).get('type', MeasuredValueScaled)
                            
                            # Update based on value type
                            if value_type == MeasuredValueShort:
                                IEC_SERVER.update_ioa(item.ioa, value)
                            else:
                                # For MeasuredValueScaled, scale the value
                                scaled_value = int(round(value / item.scale_factor))
                                IEC_SERVER.update_ioa(item.ioa, scaled_value)
                
                logger.info(f"Updated telemetry: {item.name}, data: {telemetries[item_id].model_dump()}")
                await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()])
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
async def add_tap_changer_ioa(item: TapChangerItem):
    callback = lambda ioa, ioa_object, server, is_select=None: (
        server.update_ioa_from_server(ioa, ioa_object['data']) 
        if not is_select else True
    )

    # Add IOAs to the IEC server
    IEC_SERVER.add_ioa(item.ioa_value, MeasuredValueScaled, item.value, None, False)
    IEC_SERVER.add_ioa(item.ioa_status_raise_lower, DoublePointInformation, item.ioa_status_raise_lower, None, True)
    IEC_SERVER.add_ioa(item.ioa_status_auto_manual, DoublePointInformation, item.ioa_status_auto_manual, None, True)
    IEC_SERVER.add_ioa(item.ioa_local_remote, DoublePointInformation, item.ioa_local_remote, None, True)    
    IEC_SERVER.add_ioa(item.ioa_command_raise_lower, DoubleCommand, item.ioa_command_raise_lower, None, True)
    IEC_SERVER.add_ioa(item.ioa_command_auto_manual, DoubleCommand, item.ioa_command_auto_manual, None, True)
    
    logger.info(f"Added tap changer: {item.name} with IOA {item.ioa_value} for value")
    
    return 0
    
@sio.event
async def add_tap_changer(sid, data):
    item = TapChangerItem(**data)
    tap_changers[item.id] = item
    
    result = add_tap_changer_ioa(item)
    
    if result != 0:
        await sio.emit('error', {'message': f'Failed to add tap changer {item.name}'})
        return {"status": "error", "message": f"Failed to add tap changer {item.name}"}
    
    await sio.emit('tap_changers', [item.model_dump() for item in tap_changers.values()])
    return {"status": "success", "message": f"Added tap changer {item.name}"}
        
@sio.event
async def update_tap_changer(sid, data):
    id = data.get('id')
    
    # todo
    if id:
        for item_id, item in list(tap_changers.items()):
            if id == item_id:
                # Check if IOA is being updated
                old_ioa = item.ioa
                new_ioa = data.get('ioa')
                
                # Handle IOA update if needed
                if new_ioa is not None and old_ioa != new_ioa:
                    # Remove old IOA
                    IEC_SERVER.remove_ioa(old_ioa)
                    
                    # Add new IOA
                    result = IEC_SERVER.add_ioa(new_ioa, MeasuredValueScaled, item.value, None, False)
                    if result != 0:
                        await sio.emit('error', {'message': f'Failed to update tap changer IOA to {new_ioa}'})
                        return {"status": "error", "message": f"Failed to update IOA to {new_ioa}"}
                    
                    # Update auto_mode for new IOA
                    IEC_SERVER.ioa_list[new_ioa]['auto_mode'] = item.auto_mode
                
                # Update all fields that are provided in the data
                for key, value in data.items():
                    if hasattr(tap_changers[item_id], key) and key != 'id':
                        setattr(tap_changers[item_id], key, value)
                        
                        # Update IEC server for the IOA value
                        if key == 'value':
                            IEC_SERVER.update_ioa(item.ioa, value)
                
                logger.info(f"Updated tap changer: {item.name}, data: {tap_changers[item_id].model_dump()}")
                await sio.emit('tap_changers', [item.model_dump() for item in tap_changers.values()])
                return {"status": "success"}
    return {"status": "error", "message": "Tap changer not found"}


@sio.event
async def remove_tap_changer(sid, data):
    item_id = data.get('id')
    if item_id and item_id in tap_changers:
        item = tap_changers.pop(item_id)
        
        # Remove the IOA from the IEC server
        result = IEC_SERVER.remove_ioa(item.ioa)
        if result != 0:
            await sio.emit('error', {'message': f'Failed to remove tap changer IOA {item.ioa}'})
        
        logger.info(f"Removed tap changer: {item.name}")
        await sio.emit('tap_changers', [item.model_dump() for item in tap_changers.values()], room=sid)
        return {"status": "success", "message": f"Removed tap changer {item.name}"}
    return {"status": "error", "message": "Tap changer not found"}

@sio.event
async def export_data(sid):
    """Export all data as JSON via socket."""
    try:
        logger.info("Exporting all IOA data via socket")
        
        # Get circuit breakers with correct field names
        circuit_breaker_data = []
        for cb in circuit_breakers.values():
            cb_dict = cb.model_dump()
            # Ensure field name consistency with the model
            if "has_double_point" in cb_dict:
                cb_dict["has_double_point"] = cb_dict.get("has_double_point")
            
            circuit_breaker_data.append(cb_dict)
        
        data = {
            "circuit_breakers": circuit_breaker_data,
            "telesignals": [item.model_dump() for item in telesignals.values()],
            "telemetries": [item.model_dump() for item in telemetries.values()],
            "tap_changers": [item.model_dump() for item in tap_changers.values()],
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
        tap_changers.clear()

        # Populate with new data
        for cb in data.get("circuit_breakers", []):
            # Fix field name mismatch
            if "is_double_point" in cb and "has_double_point" not in cb:
                cb["has_double_point"] = cb.pop("is_double_point")
            
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
            
            # Determine type based on scale factor
            if item.scale_factor >= 1:
                value_type = MeasuredValueScaled
                scaled_value = int(item.value / item.scale_factor)
            else:
                value_type = MeasuredValueShort
                scaled_value = item.value
    
            result = IEC_SERVER.add_ioa(item.ioa, value_type, scaled_value, None, True)
            if result == 0:
                # Initialize with auto_mode disabled
                IEC_SERVER.ioa_list[item.ioa]['auto_mode'] = False
                IEC_SERVER.ioa_list[item.ioa]['min_value'] = item.min_value
                IEC_SERVER.ioa_list[item.ioa]['max_value'] = item.max_value
                IEC_SERVER.ioa_list[item.ioa]['scale_factor'] = item.scale_factor
                IEC_SERVER.ioa_list[item.ioa]['value_type'] = value_type.__name__
                
                logger.info(f"Added telemetry: {item.name} with IOA {item.ioa} using {value_type.__name__}")
            else:
                await sio.emit('error', {'message': f'Failed to add telemetry IOA {item.ioa}'})
                
        # todo
        for tc in data.get("tap_changers", []):
            item = TapChangerItem(**tc)
            tap_changers[item.id] = item
            
        
        # Emit updated data to all clients 
        await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()], room=sid)
        await sio.emit('telesignals', [item.model_dump() for item in telesignals.values()], room=sid)
        await sio.emit('telemetries', [item.model_dump() for item in telemetries.values()], room=sid)
        await sio.emit('tap_changers', [item.model_dump() for item in tap_changers.values()], room=sid)
        await sio.emit('import_data_response', {"status": "success"}, room=sid)
    except Exception as e:
        logger.error(f"Error importing data: {e}")
        await sio.emit('import_data_error', {"error": "Failed to import data"}, room=sid)

@sio.event
async def update_order(sid, data):
    item_type = data.get('type')
    item_ids = data.get('items', [])
    
    if item_type == 'circuit_breakers':
        # Reorder circuit_breakers based on item_ids
        global circuit_breakers
        ordered_items = {}
        for id in item_ids:
            if id in circuit_breakers:
                ordered_items[id] = circuit_breakers[id]
        circuit_breakers = ordered_items
        
    elif item_type == 'telesignals':
        # Reorder telesignals
        global telesignals
        ordered_items = {}
        for id in item_ids:
            if id in telesignals:
                ordered_items[id] = telesignals[id]
        telesignals = ordered_items
        
    elif item_type == 'telemetries':
        # Reorder telemetries
        global telemetries
        ordered_items = {}
        for id in item_ids:
            if id in telemetries:
                ordered_items[id] = telemetries[id]
        telemetries = ordered_items
        
    elif item_type == 'tap_changers':
        # Reorder tap_changers
        global tap_changers
        ordered_items = {}
        for id in item_ids:
            if id in tap_changers:
                ordered_items[id] = tap_changers[id]
        tap_changers = ordered_items
    
async def monitor_circuit_breaker_changes():
    """
    Continuously monitor circuit breaker values for changes from external sources.
    When changes are detected, emit the updated values to the frontend.
    """
    logger.info("Starting circuit breaker monitoring task")
    
    # Store previous values for comparison
    previous_values = {}
    
    while True:
        try:
            changes_detected = False
            
            # Check all circuit breakers for changes by comparing IEC_SERVER values with local values
            for cb_id, cb in list(circuit_breakers.items()):
                cb_changed = False
                
                # Initialize previous values dictionary for this circuit breaker if not exists
                if cb_id not in previous_values:
                    previous_values[cb_id] = {
                        "cb_status": None, 
                        "cb_status_close": None,
                        "cb_status_dp": None,
                        "control_open": None,
                        "control_close": None,
                        "control_dp": None,
                        "remote_sp": None,
                        "remote_dp": None,
                        "has_local_remote_dp_mode": None
                    }
                
                # Check if single point status values changed
                if cb.ioa_cb_status in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_cb_status]['data']
                    if previous_values[cb_id]["cb_status"] != server_value:
                        previous_values[cb_id]["cb_status"] = server_value
                        circuit_breakers[cb_id].cb_status_open = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} status open: {server_value}")
                
                if cb.ioa_cb_status_close in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_cb_status_close]['data']
                    if previous_values[cb_id]["cb_status_close"] != server_value:
                        previous_values[cb_id]["cb_status_close"] = server_value
                        circuit_breakers[cb_id].cb_status_close = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} status close: {server_value}")
                
                # Check if double point status value changed
                if cb.has_double_point and cb.ioa_cb_status_dp and cb.ioa_cb_status_dp in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_cb_status_dp]['data']
                    if previous_values[cb_id]["cb_status_dp"] != server_value:
                        previous_values[cb_id]["cb_status_dp"] = server_value
                        circuit_breakers[cb_id].cb_status_dp = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} status DP: {server_value}")
                
                # Check if control values changed
                if cb.ioa_control_open in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_control_open]['data']
                    if previous_values[cb_id]["control_open"] != server_value:
                        previous_values[cb_id]["control_open"] = server_value
                        circuit_breakers[cb_id].control_open = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} control open: {server_value}")
                
                if cb.ioa_control_close in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_control_close]['data']
                    if previous_values[cb_id]["control_close"] != server_value:
                        previous_values[cb_id]["control_close"] = server_value
                        circuit_breakers[cb_id].control_close = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} control close: {server_value}")
                
                if cb.has_double_point and cb.ioa_control_dp and cb.ioa_control_dp in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_control_dp]['data']
                    if previous_values[cb_id]["control_dp"] != server_value:
                        previous_values[cb_id]["control_dp"] = server_value
                        circuit_breakers[cb_id].control_dp = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} control DP: {server_value}")
                
                # Check if local/remote single point changed
                if cb.ioa_local_remote_sp in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_local_remote_sp]['data']
                    if previous_values[cb_id]["remote_sp"] != server_value:
                        previous_values[cb_id]["remote_sp"] = server_value
                        circuit_breakers[cb_id].remote_sp = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} remote SP: {server_value}")
                
                # Check if local/remote double point changed
                if cb.has_local_remote_dp and cb.ioa_local_remote_dp in IEC_SERVER.ioa_list:
                    server_value = IEC_SERVER.ioa_list[cb.ioa_local_remote_dp]['data']
                    if previous_values[cb_id]["remote_dp"] != server_value:
                        previous_values[cb_id]["remote_dp"] = server_value
                        circuit_breakers[cb_id].remote_dp = server_value
                        cb_changed = True
                        logger.info(f"Change detected for CB {cb.name} remote DP: {server_value}")

                if cb_changed:
                    changes_detected = True
            
            # If any circuit breaker changed, emit the updated list to all connected clients
            if changes_detected:
                await sio.emit('circuit_breakers', [item.model_dump() for item in circuit_breakers.values()])
            
            # Sleep briefly to avoid excessive CPU usage
            await asyncio.sleep(0.1)
            
        except Exception as e:
            logger.error(f"Error in circuit breaker monitoring task: {str(e)}")
            await asyncio.sleep(3)  # Wait before retrying if there's an error
            
# todo
async def monitor_tap_changer_changes():
    """
    Continuously monitor tap changer values for changes from external sources.
    When changes are detected, emit the updated values to the frontend.
    """
    logger.info("Starting tap changer monitoring task")

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
            
            # Simulate telesignals in auto mode
            for item_id, item in list(telesignals.items()):
                # Skip if not due for update yet
                last_update = last_update_times["telesignals"].get(item_id, 0)
                if current_time - last_update < item.interval:
                    continue
                
                # Check if auto mode is enabled
                if not getattr(item, 'auto_mode', True):  # Default to True for backward compatibility
                    continue
                    
                new_value = random.randint(0, 1)  # Simulate a random value for the telesignal
                if new_value != item.value:
                    telesignals[item_id].value = new_value
                    IEC_SERVER.update_ioa(item.ioa, new_value)
                    
                    logger.info(f"Telesignal auto-updated: {item.name} (IOA: {item.ioa}) value: {telesignals[item_id].value}")
                    
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
                    
                # Generate a random value within range that's a multiple of the scale factor
                scale_factor = item.scale_factor
                # Determine how many possible steps exist within the range
                possible_steps = int(round((item.max_value - item.min_value) / scale_factor)) + 1
                # Choose a random step
                random_step = random.randint(0, possible_steps - 1)
                new_value = item.min_value + (random_step * scale_factor)
                # Determine precision based on scale factor
                precision = 0 if scale_factor >= 1 else -int(math.floor(math.log10(scale_factor)))
                # Round to appropriate precision to avoid floating point errors
                new_value = round(new_value, precision)
                
                # Update the telemetry object with the new value
                telemetries[item_id].value = new_value
                
                # Get the value type from IOA list
                value_type = IEC_SERVER.ioa_list.get(item.ioa, {}).get('type', MeasuredValueScaled)
                
                # Update based on value type
                if value_type == MeasuredValueShort:
                    # For MeasuredValueShort, use the actual value
                    IEC_SERVER.update_ioa(item.ioa, new_value)
                else:
                    # For MeasuredValueScaled, scale the value
                    scaled_value = int(round(new_value / scale_factor))
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
    monitor_task = asyncio.create_task(monitor_circuit_breaker_changes())
    monitor_tap_changer_task = asyncio.create_task(monitor_tap_changer_changes())

    yield

    # Cancel the polling task when shutting down
    polling_task.cancel()
    monitor_task.cancel()
    monitor_tap_changer_task.cancel()
    
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

# API endpoint home
@app.get("/")
async def root():
    return {
        "message": "Modbus TCP Server Simulator API", 
        "status": "running",
        "items": {
            "circuit_breakers": len(circuit_breakers),
            "telesignals": len(telesignals),
            "telemetries": len(telemetries),
            "tap_changers": len(tap_changers)
        }
    }

# Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    uvicorn.run(socket_app, host=FASTAPI_HOST, port=FASTAPI_PORT)