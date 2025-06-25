export interface CircuitBreakerItem {
  id: string;
  name: string;

  ioa_cb_status: number;
  ioa_cb_status_close: number; 
  ioa_control_open: number;
  ioa_control_close: number;
  ioa_cb_status_dp?: number;
  ioa_control_dp?: number;
  ioa_local_remote_sp: number;
  ioa_local_remote_dp?: number;
  is_sbo: boolean;
  has_double_point: boolean;
  is_dp_mode: boolean;
  is_sdp_mode: boolean;
  has_local_remote_dp: boolean;
  is_local_remote_dp_mode: boolean;
  remote_sp: number;
  remote_dp: number;
  cb_status_open: number
  cb_status_close: number
  cb_status_dp: number
  control_open: number
  control_close: number
  control_dp: number

  
}

export interface TeleSignalItem {
  id: string;
  name: string;
  ioa: number;
  value: number;
  min_value: number;
  max_value: number;
  interval: number;
  auto_mode: boolean; // true is auto, false is manual
}

export interface TelemetryItem {
  id: string;
  name: string;
  ioa: number;
  value: number;
  unit: string;
  min_value: number;
  max_value: number;
  scale_factor: number;
  interval: number;
  auto_mode: boolean; // true is auto, false is manual
}

export interface TapChangerItem {
  id: string;
  name: string;
  ioa_value: number;
  value: number;
  value_high_limit: number;
  value_low_limit: number;
  ioa_high_limit: number;
  ioa_low_limit: number;
  ioa_status_raise_lower: number;
  ioa_command_raise_lower: number;
  interval: number;
  auto_mode: boolean;
  ioa_status_auto_manual: number;
  ioa_command_auto_manual: number;
  is_local_remote: number;
  ioa_local_remote: number;
}

export type Item = CircuitBreakerItem | TeleSignalItem | TelemetryItem | TapChangerItem;