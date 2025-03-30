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

  // useEffect(() => {
  //   socket.on('circuit_breakers', (data: CircuitBreakerItem[]) => {
  //     console.log('Received circuit breakers update:', data);
  //     setCircuitBreakers(data);
  //   });

  //   socket.on('tele_signals', (data: TeleSignalItem[]) => {
  //     console.log('Received telesignals update:', data);
  //     setTeleSignals(data);
  //   });

  //   socket.on('telemetry_items', (data: TelemetryItem[]) => {
  //     console.log('Received telemetry update:', data);
  //     setTelemetry(data);
  //   });

  //   return () => {
  //     socket.off('circuit_breakers');
  //     socket.off('tele_signals');
  //     socket.off('telemetry_items');
  //   };
  // }, []);

  useEffect(() => {
    socket.on('ioa_values', (data) => {
      // This handles all IOA values at once
      console.log('Received IOA values update:', data);

      // Update telesignals
      setTeleSignals(prev => prev.map(item => {
        if (data[item.ioa] && data[item.ioa].type === 'telesignal') {
          return { ...item, value: data[item.ioa].value };
        }
        return item;
      }));

      // Update telemetry
      setTelemetry(prev => prev.map(item => {
        if (data[item.ioa] && data[item.ioa].type === 'telemetry') {
          return { ...item, value: data[item.ioa].value };
        }
        return item;
      }));
    });

    // Handle dynamic telesignal operations
    socket.on('telesignal_added', (data) => {
      console.log('Telesignal added:', data);
      setTeleSignals(prev => [
        ...prev,
        {
          id: `ts-${data.ioa}`,
          name: data.name,
          ioa: data.ioa,
          value: data.value
        }
      ]);
    });

    socket.on('telesignal_removed', (data) => {
      console.log('Telesignal removed:', data);
      setTeleSignals(prev => prev.filter(item => item.ioa !== data.ioa));
    });

    socket.on('telesignal_updated', (data) => {
      console.log('Telesignal updated:', data);
      setTeleSignals(prev =>
        prev.map(item =>
          item.ioa === data.ioa ? { ...item, value: data.value } : item
        )
      );
    });

    // Handle dynamic telemetry operations
    socket.on('telemetry_added', (data) => {
      console.log('Telemetry added:', data);
      setTelemetry(prev => [
        ...prev,
        {
          id: `tm-${data.ioa}`,
          name: data.name,
          ioa: data.ioa,
          value: data.value,
          unit: data.unit || '',
          min_value: data.min_value || 0,
          max_value: data.max_value || 100,
          scale_factor: data.scale_factor || 1
        }
      ]);
    });

    socket.on('telemetry_removed', (data) => {
      console.log('Telemetry removed:', data);
      setTelemetry(prev => prev.filter(item => item.ioa !== data.ioa));
    });

    socket.on('telemetry_updated', (data) => {
      console.log('Telemetry updated:', data);
      setTelemetry(prev =>
        prev.map(item =>
          item.ioa === data.ioa ? { ...item, value: data.value } : item
        )
      );
    });

    return () => {
      socket.off('ioa_values');
      socket.off('telesignal_added');
      socket.off('telesignal_removed');
      socket.off('telesignal_updated');
      socket.off('telemetry_added');
      socket.off('telemetry_removed');
      socket.off('telemetry_updated');
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

  // const addTeleSignal = (data: {
  //   name: string;
  //   ioa: number;
  //   interval: number;
  //   value: number;
  // }) => {
  //   const newItem: TeleSignalItem = {
  //     id: Date.now().toString(),
  //     name: data.name,
  //     ioa: data.ioa,
  //     value: data.value,
  //     min_value: 0,
  //     max_value: 1,
  //     interval: data.interval
  //   };

  //   if (socket) {
  //     socket.emit('add_tele_signal', newItem, (response: any) => {
  //       console.log('Add tele signal response:', response);
  //     });
  //   }
  // };

  // const removeTeleSignal = (data: { id: string }) => {
  //   if (socket) {
  //     socket.emit('remove_tele_signal', data, (response: any) => {
  //       console.log('Remove tele signal response:', response);
  //     });
  //   }
  // };

  // const addTelemetry = (data: {
  //   name: string;
  //   ioa: number;
  //   unit: string;
  //   value: number;
  //   min_value: number;
  //   max_value: number;
  //   interval: number;
  //   scale_factor: number;
  // }) => {
  //   const newItem: TelemetryItem = {
  //     id: Date.now().toString(),
  //     name: data.name,
  //     ioa: data.ioa,
  //     unit: data.unit || 'Unit',
  //     value: data.value,
  //     scale_factor: parseFloat(data.scale_factor?.toString() || "1"),
  //     min_value: data.min_value,
  //     max_value: data.max_value,
  //     interval: data.interval
  //   };

  //   if (socket) {
  //     socket.emit('add_telemetry', newItem, (response: any) => {
  //       console.log('Add telemetry response:', response);
  //     });
  //   }
  // };

  // const removeTelemetry = (data: { id: string }) => {
  //   if (socket) {
  //     socket.emit('remove_telemetry', data, (response: any) => {
  //       console.log('Remove telemetry response:', response);
  //     });
  //   }
  // };

  const handleAddTeleSignal = (data: { name: string, ioa: number, interval: number }) => {
    socket.emit('add_telesignal', {
      ioa: data.ioa,
      name: data.name,
      value: 0, // Default value
      interval: data.interval,
    });
  };

  // Handler for removing a telesignal
  const handleRemoveTeleSignal = (data: { id: string }) => {
    // Extract IOA from the ID or find the item in teleSignals
    const item = teleSignals.find(item => item.id === data.id);
    if (item) {
      socket.emit('remove_telesignal', { ioa: item.ioa });
    }
  };

  // Handler for adding a new telemetry
  const handleAddTelemetry = (data: {
    name: string,
    ioa: number,
    unit: string,
    interval: number,
    value: number,
    min_value: number,
    max_value: number,
    scale_factor: number
  }) => {
    socket.emit('add_telemetry', {
      ioa: data.ioa,
      name: data.name,
      interval: data.interval,
      value: data.value, // Default to min value
      unit: data.unit,
      min_value: data.min_value,
      max_value: data.max_value,
      scale_factor: data.scale_factor
    });
  };

  // Handler for removing a telemetry
  const handleRemoveTelemetry = (data: { id: string }) => {
    // Extract IOA from the ID or find the item in telemetry
    const item = telemetry.find(item => item.id === data.id);
    if (item) {
      socket.emit('remove_telemetry', { ioa: item.ioa });
    }
  }

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
            onAdd={handleAddTeleSignal}
            onRemove={handleRemoveTeleSignal}
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
            onAdd={handleAddTelemetry}
            onRemove={handleRemoveTelemetry}
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