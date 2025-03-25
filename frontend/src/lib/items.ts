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
  value: number;
  min_value: number;
  max_value: number;
  interval: number;
}

export interface TeleSignalItem {
  id: string;
  name: string;
  ioa: number; // address
  value: number; // 0 is off, 1 is on
  min_value: number;
  max_value: number;
  interval: number;
}

export interface TelemetryItem {
  id: string;
  name: string;
  ioa: number; // address
  unit: string;
  value: number;
  scale_factor: number;
  min_value: number;
  max_value: number;
  interval: number;
}

export type Item = CircuitBreakerItem | TeleSignalItem | TelemetryItem;