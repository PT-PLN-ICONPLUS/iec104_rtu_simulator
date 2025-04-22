export interface CircuitBreakerItem {
  id: string;
  name: string;

  ioa_cb_status: number;
  ioa_cb_status_close: number; 
  ioa_control_open: number;
  ioa_control_close: number;
  ioa_cb_status_dp?: number;
  ioa_control_dp?: number;
  ioa_local_remote: number;
  is_sbo: boolean;
  is_double_point: boolean;

  remote: number;
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

export type Item = CircuitBreakerItem | TeleSignalItem | TelemetryItem;