// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import socket from './socket';
import { SectionTitle } from './components/SectionTitleItem';
import { CircuitBreaker } from './components/CircuitBreakerItem';
import { TeleSignal } from './components/TeleSignalItem';
import { Telemetry } from './components/TeleMetryItem';
import { CircuitBreakerItem, TeleSignalItem, TelemetryItem } from './lib/items';

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './components/SortableItem';

function App() {
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerItem[]>([]);
  const [teleSignals, setTeleSignals] = useState<TeleSignalItem[]>([]);
  const [teleMetries, setTeleMetries] = useState<TelemetryItem[]>([]);

  useEffect(() => {
    // Emit 'get_initial_data' to request initial data
    socket.emit('get_initial_data');

    // Listen for the response
    socket.on('get_initial_data_response', (response: {
      circuit_breakers: CircuitBreakerItem[];
      telesignals: TeleSignalItem[];
      telemetries: TelemetryItem[];
    }) => {
      console.log('Initial data received:', response);

      // Update state with initial data
      setCircuitBreakers(response.circuit_breakers || []);
      setTeleSignals(response.telesignals || []);
      setTeleMetries(response.telemetries || []);
    });

    // Handle errors
    socket.on('get_initial_data_error', (error: unknown) => {
      console.error('Error fetching initial data:', error);
      alert('Failed to fetch initial data. Please check the console for details.');
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('get_initial_data_response');
      socket.off('get_initial_data_error');
    };
  }, []);

  useEffect(() => {
    socket.on('circuit_breakers', (data: CircuitBreakerItem[]) => {
      console.log('Received circuit breakers update:', data);
      setCircuitBreakers(data);
    });

    socket.on('telesignals', (data: TeleSignalItem[]) => {
      console.log('Received telesignals update:', data);
      setTeleSignals(data);
    });

    socket.on('telemetries', (data: TelemetryItem[]) => {
      console.log('Received telemetry update:', data);
      setTeleMetries(data);
    });


    return () => {
      socket.off('circuit_breakers');
      socket.off('telesignals');
      socket.off('telemetries');
    };
  }, []);

  const addCircuitBreaker = (data: CircuitBreakerItem) => {
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
      is_sdp_mode: data.is_sdp_mode,

      remote: 0,
      cb_status_open: 0,
      cb_status_close: 0,
      cb_status_dp: 0,
      control_open: 0,
      control_close: 0,
      control_dp: 0,
    };

    // Send to backend
    if (socket) {
      socket.emit('add_circuit_breaker', newItem, (response: unknown) => {
        console.log('Add circuit breaker response:', response);
      });
    }
  };

  const removeCircuitBreaker = (data: { id: string }) => {
    // Send to backend instead of just updating local state
    if (socket) {
      socket.emit('remove_circuit_breaker', data, (response: unknown) => {
        console.log('Remove circuit breaker response:', response);
      });
    }
  };

  const addTeleSignal = (data: TeleSignalItem) => {
    const newItem: TeleSignalItem = {
      id: Date.now().toString(),
      name: data.name,
      ioa: data.ioa,
      value: data.value,
      min_value: 0,
      max_value: 1,
      interval: data.interval,
      auto_mode: false, // default to manual mode
    };

    if (socket) {
      socket.emit('add_telesignal', newItem, (response: unknown) => {
        console.log('Add tele signal response:', response);
      });
    }
  };

  const removeTeleSignal = (data: { id: string }) => {
    if (socket) {
      socket.emit('remove_telesignal', data, (response: unknown) => {
        console.log('Remove tele signal response:', response);
      });
    }
  };

  const addTelemetry = (data: TelemetryItem) => {
    const newItem: TelemetryItem = {
      id: Date.now().toString(),
      name: data.name,
      ioa: data.ioa,
      unit: data.unit || 'Unit',
      value: data.value,
      scale_factor: parseFloat(data.scale_factor?.toString() || "1"),
      min_value: data.min_value,
      max_value: data.max_value,
      interval: data.interval,
      auto_mode: false, // default to manual mode
    };

    if (socket) {
      socket.emit('add_telemetry', newItem, (response: unknown) => {
        console.log('Add telemetry response:', response);
      });
    }
  };

  const removeTelemetry = (data: { id: string }) => {
    if (socket) {
      socket.emit('remove_telemetry', data, (response: unknown) => {
        console.log('Remove telemetry response:', response);
      });
    }
  };

  const exportData = () => {
    socket.emit('export_data');

    socket.on('export_data_response', (data) => {
      console.log('Exported data:', data);

      // Validate the structure of the data
      if (!data.circuit_breakers || !data.telesignals || !data.telemetries) {
        alert('Invalid data structure received from the server');
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'exported_data.json';
      link.click();
    });

    socket.on('export_data_error', (error) => {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please check the console for details.');
    });
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        socket.emit('import_data', data);

        socket.on('import_data_response', (response) => {
          console.log('Import successful:', response);
          alert('Data imported successfully');
        });

        socket.on('import_data_error', (error) => {
          console.error('Error importing data:', error);
          alert('Failed to import data. Please check the console for details.');
        });
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const handleDragEndCircuitBreakers = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCircuitBreakers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Emit the new order to backend if needed
        socket.emit('update_order', {
          type: 'circuit_breakers',
          items: newItems.map(item => item.id)
        });

        return newItems;
      });
    }
  };

  const handleDragEndTeleSignals = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTeleSignals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Emit the new order to backend if needed
        socket.emit('update_order', {
          type: 'telesignals',
          items: newItems.map(item => item.id)
        });

        return newItems;
      });
    }
  };

  const handleDragEndTeleMetries = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTeleMetries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Emit the new order to backend if needed
        socket.emit('update_order', {
          type: 'telemetries',
          items: newItems.map(item => item.id)
        });

        return newItems;
      });
    }
  };

  return (
    <div className="min-w-screen fixed">
      <div className="flex justify-between items-center py-3 px-4 border-b">
        <div className="flex items-center space-x-2">
          <img src="/iec.ico" alt="IEC Icon" className="w-6 h-6" />
          <p className="text-2xl font-bold">IEC104 Server Simulator</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportData}
            className="bg-blue-500 text-white px-2 py-1  rounded border border-black hover:bg-blue-600"
          >
            Export
          </button>
          <label
            htmlFor="import-file"
            className="bg-green-500 text-white px-2 py-1 rounded border border-black hover:bg-green-600 cursor-pointer"
          >
            Import
          </label>
          <input
            id="import-file"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files && importData(e.target.files[0])}
          />
        </div>
      </div>

      <div className="flex flex-row w-full">
        {/* Circuit Breaker Section */}
        <div className="w-1/3 border-2 flex flex-col h-[95vh]">
          {/* Header Circuit Breaker Section */}
          <SectionTitle
            title="Circuit Breakers"
            onAdd={data => addCircuitBreaker(data as CircuitBreakerItem)}
            onRemove={removeCircuitBreaker}
            items={circuitBreakers}
          />
          <div className="flex-1 overflow-y-auto">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndCircuitBreakers}
            >
              <SortableContext
                items={circuitBreakers.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >

                {circuitBreakers.map(item => (
                  <SortableItem key={item.id} id={item.id}>
                    <CircuitBreaker
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      ioa_cb_status={item.ioa_cb_status}
                      ioa_cb_status_close={item.ioa_cb_status_close}
                      ioa_cb_status_dp={item.ioa_cb_status_dp}
                      ioa_control_dp={item.ioa_control_dp}
                      ioa_control_open={item.ioa_control_open}
                      ioa_control_close={item.ioa_control_close}
                      ioa_local_remote={item.ioa_local_remote}
                      is_sdp_mode={item.is_sdp_mode}

                      is_sbo={item.is_sbo}
                      is_double_point={item.is_double_point}

                      remote={item.remote}
                      cb_status_open={0}
                      cb_status_close={item.cb_status_close}
                      cb_status_dp={item.cb_status_dp}
                      control_open={item.control_open}
                      control_close={item.control_close}
                      control_dp={item.control_dp}
                    />
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Telesignal Section */}
        <div className="w-1/3 border-2 flex flex-col h-[95vh]">
          <SectionTitle
            title="Telesignals"
            onAdd={data => addTeleSignal(data as TeleSignalItem)}
            onRemove={removeTeleSignal}
            items={teleSignals}
          />
          <div className="flex-1 overflow-y-auto">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndTeleSignals}
            >
              <SortableContext
                items={teleSignals.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {teleSignals.map(item => (
                  <SortableItem key={item.id} id={item.id}>
                    <TeleSignal
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      ioa={item.ioa}
                      value={item.value}
                      min_value={item.min_value}
                      max_value={item.max_value}
                      interval={item.interval}
                      auto_mode={item.auto_mode}
                    />
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Telemetry Section */}
        <div className="w-1/3 border-2 flex flex-col h-[95vh]">
          <SectionTitle
            title="Telemetry"
            onAdd={data => addTelemetry(data as TelemetryItem)}
            onRemove={removeTelemetry}
            items={teleMetries}
          />
          <div className="flex-1 overflow-y-auto">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndTeleMetries}
            >
              <SortableContext
                items={teleMetries.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {teleMetries.map(item => (
                  <SortableItem key={item.id} id={item.id}>
                    <Telemetry
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      ioa={item.ioa}
                      value={item.value}
                      unit={item.unit}
                      min_value={item.min_value}
                      max_value={item.max_value}
                      scale_factor={item.scale_factor}
                      interval={item.interval}
                      auto_mode={item.auto_mode}
                    />
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;