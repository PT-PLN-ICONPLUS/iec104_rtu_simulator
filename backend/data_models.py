from pydantic import BaseModel
from typing import Optional

class CircuitBreakerItem(BaseModel):
    id: str
    name: str
    
    ioa_cb_status: int           # CB Status Single Open
    ioa_cb_status_close: int     # CB Status Single Close 
    ioa_cb_status_dp: Optional[int] = None  # CB Status
    ioa_control_open: int        # Control Open 
    ioa_control_close: int       # Control Close
    ioa_control_dp: Optional[int] = None  # Control Double 
    ioa_local_remote_sp: int        # Local/Remote Position 
    ioa_local_remote_dp: int  # Local/Remote Double
    
    is_sbo: bool
    
    has_double_point: bool
    
    is_dp_mode: Optional[bool] = False
    is_sdp_mode: Optional[bool] = False
    
    has_local_remote_dp: Optional[bool] = True
    is_local_remote_dp_mode: Optional[bool] = False
    
    remote_sp: int = 0
    remote_dp: int = 0
    cb_status_open: int = 0
    cb_status_close: int = 0
    cb_status_dp: int = 0
    control_open: int = 0
    control_close: int = 0
    control_dp: int = 0
    
class TeleSignalItem(BaseModel):
    id: str
    name: str
    ioa: int
    value: int = 0
    interval: int = 2
    auto_mode: bool = True

class TelemetryItem(BaseModel):
    id: str
    name: str
    ioa: int
    unit: str
    value: float
    scale_factor: float
    min_value: float
    max_value: float
    interval: int = 2
    auto_mode: bool = True
    
class TapChangerItem(BaseModel):
    id: str
    name: str
    ioa_value: int
    value: int
    
    value_high_limit: int
    value_low_limit: int

    ioa_high_limit: int
    ioa_low_limit: int
    
    ioa_status_raise_lower: int  # 1: lower, 2: raise, 0: neutral
    ioa_command_raise_lower: int
    
    interval: int = 1
    auto_mode: int = 2  # 1: manual, 2: auto
    ioa_status_auto_manual: int
    ioa_command_auto_manual: int
    
    is_local_remote: int
    ioa_local_remote: int    


    # Export all classes
    __all__ = [
      'CircuitBreakerItem',
      'TeleSignalItem',
      'TelemetryItem',
      'TapChangerItem'
    ]