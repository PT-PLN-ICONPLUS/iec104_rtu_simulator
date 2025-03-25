// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import socket from './socket';
import { SectionTitle } from './components/SectionTitleItem';
import { CircuitBreaker } from './components/CircuitBreakerItem';
import { TeleSignal } from './components/TeleSignalItem';
import { Telemetry } from './components/TeleMetryItem';
import { CircuitBreakerItem, TeleSignalItem, TelemetryItem } from './lib/items';

function App() {
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerItem[]>([]);
  const [teleSignals, setTeleSignals] = useState<TeleSignalItem[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryItem[]>([]);

  useEffect(() => {
    socket.on('circuit_breakers', (data: CircuitBreakerItem[]) => {
      console.log('Received circuit breakers update:', data);
      setCircuitBreakers(data);
    });

    socket.on('tele_signals', (data: TeleSignalItem[]) => {
      console.log('Received telesignals update:', data);
      setTeleSignals(data);
    });

    socket.on('telemetry_items', (data: TelemetryItem[]) => {
      console.log('Received telemetry update:', data);
      setTelemetry(data);
    });

    return () => {
      socket.off('circuit_breakers');
      socket.off('tele_signals');
      socket.off('telemetry_items');
    };
  }, []);

  const addCircuitBreaker = (data: {
    name: string;
    ioa_cb_status: number;
    ioa_cb_status_close: number;
    ioa_cb_status_dp?: number;
    ioa_control_dp?: number;
    ioa_control_open: number;
    ioa_control_close: number;
    ioa_local_remote: number;
    is_double_point: boolean;
    interval: number;

  }) => {
    const newItem: CircuitBreakerItem = {
      id: Date.now().toString(),
      name: data.name,
      ioa_cb_status: data.ioa_cb_status,
      ioa_cb_status_close: data.ioa_cb_status_close,
      ioa_control_open: data.ioa_control_open,
      ioa_control_close: data.ioa_control_close,
      ioa_cb_status_dp: data.ioa_cb_status_dp,
      ioa_control_dp: data.ioa_control_dp,
      ioa_local_remote: data.ioa_local_remote,
      is_sbo: false,
      is_double_point: data.is_double_point,
      remote: 0,
      value: 0,
      min_value: 0,
      max_value: 3,
      interval: data.interval
    };

    // Send to backend
    if (socket) {
      socket.emit('add_circuit_breaker', newItem, (response: any) => {
        console.log('Add circuit breaker response:', response);
      });
    }
  };

  const removeCircuitBreaker = (data: { id: string }) => {
    // Send to backend instead of just updating local state
    if (socket) {
      socket.emit('remove_circuit_breaker', data, (response: any) => {
        console.log('Remove circuit breaker response:', response);
      });
    }
  };

  const addTeleSignal = (data: {
    name: string;
    ioa: number;
    interval: number;
    value: number;
  }) => {
    const newItem: TeleSignalItem = {
      id: Date.now().toString(),
      name: data.name,
      ioa: data.ioa,
      value: data.value,
      min_value: 0,
      max_value: 1,
      interval: data.interval
    };

    if (socket) {
      socket.emit('add_tele_signal', newItem, (response: any) => {
        console.log('Add tele signal response:', response);
      });
    }
  };

  const removeTeleSignal = (data: { id: string }) => {
    if (socket) {
      socket.emit('remove_tele_signal', data, (response: any) => {
        console.log('Remove tele signal response:', response);
      });
    }
  };

  const addTelemetry = (data: {
    name: string;
    ioa: number;
    unit: string;
    value: number;
    min_value: number;
    max_value: number;
    interval: number;
    scale_factor: number;
  }) => {
    const newItem: TelemetryItem = {
      id: Date.now().toString(),
      name: data.name,
      ioa: data.ioa,
      unit: data.unit || 'Unit',
      value: data.value,
      scale_factor: parseFloat(data.scale_factor?.toString() || "1"),
      min_value: data.min_value,
      max_value: data.max_value,
      interval: data.interval
    };

    if (socket) {
      socket.emit('add_telemetry', newItem, (response: any) => {
        console.log('Add telemetry response:', response);
      });
    }
  };

  const removeTelemetry = (data: { id: string }) => {
    if (socket) {
      socket.emit('remove_telemetry', data, (response: any) => {
        console.log('Remove telemetry response:', response);
      });
    }
  };

  return (
    <div className="min-w-screen">
      <h1 className="text-3xl font-bold py-3 text-center">IEC104 Server Simulator</h1>

      <div className="flex flex-row w-full min-h-screen">
        {/* Circuit Breaker Section */}
        <div className="w-1/3 border-2">
          {/* Header Circuit Breaker Section */}
          <SectionTitle
            title="Circuit Breakers"
            onAdd={addCircuitBreaker}
            onRemove={removeCircuitBreaker}
            items={circuitBreakers}
          />
          {circuitBreakers.map(item => (
            <CircuitBreaker
              key={item.id}
              name={item.name}
              ioa_cb_status={item.ioa_cb_status}
              ioa_cb_status_close={item.ioa_cb_status_close}
              ioa_cb_status_dp={item.ioa_cb_status_dp}
              ioa_control_dp={item.ioa_control_dp}
              ioa_control_open={item.ioa_control_open}
              ioa_control_close={item.ioa_control_close}
              ioa_local_remote={item.ioa_local_remote}
              remote={item.remote}
              is_sbo={item.is_sbo}
              is_double_point={item.is_double_point}
              interval={item.interval}
            />
          ))}
        </div>

        {/* Telesignal Section */}
        <div className="w-1/3 border-2">
          <SectionTitle
            title="Telesignals"
            onAdd={addTeleSignal}
            onRemove={removeTeleSignal}
            items={teleSignals}
          />
          {teleSignals.map(item => (
            <TeleSignal
              key={item.id}
              name={item.name}
              ioa={item.ioa}
              value={item.value} />
          ))}
        </div>

        {/* Telemetry Section */}
        <div className="w-1/3 border-2">
          <SectionTitle
            title="Telemetry"
            onAdd={addTelemetry}
            onRemove={removeTelemetry}
            items={telemetry}
          />
          {telemetry.map(item => (
            <Telemetry
              key={item.id}
              name={item.name}
              ioa={item.ioa}
              unit={item.unit}
              value={item.value}
              min_value={item.min_value}
              max_value={item.max_value}
              scale_factor={item.scale_factor || 1.0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;