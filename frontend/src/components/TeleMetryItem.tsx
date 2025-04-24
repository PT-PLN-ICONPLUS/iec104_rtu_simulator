// frontend/src/components/TeleMetryItem.tsx
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import socket from '../socket';
import { TelemetryItem } from '@/lib/items';

function Telemetry(item: TelemetryItem) {
  const [value, setValue] = useState(item.value); // Value as float
  const [isAuto, setAuto] = useState(item.auto_mode);

  useEffect(() => {
    const handleUpdate = (data: TelemetryItem[]) => {
      // Filter the data to find the specific item based on ioa
      const filtered = data.filter((look: TelemetryItem) => look.ioa === item.ioa);

      if (filtered[0].ioa === item.ioa) {
        setValue(filtered[0].value);
        setAuto(filtered[0].auto_mode);
      }
    }

    socket.on('telemetries', handleUpdate);
    return () => {
      socket.off('telemetries', handleUpdate);
    }
  }, [item.ioa]);

  const increaseValue = () => {
    setValue(prev => {
      let newValue = prev + item.scale_factor;

      // Ensure the value is a precise multiple of the item.scale_factor
      const precision = item.scale_factor >= 1 ? 0 : -Math.floor(Math.log10(item.scale_factor));
      newValue = Number((Math.round(newValue / item.scale_factor) * item.scale_factor).toFixed(precision));

      // Ensure we don't exceed max value
      newValue = Math.min(newValue, item.max_value);

      // Send value update to backend
      socket.emit('update_telemetry', {
        ioa: item.ioa,
        value: newValue
      });

      return newValue;
    });
  };

  const decreaseValue = () => {
    setValue(prev => {
      // Calculate next value as a multiple of step
      let newValue = prev - item.scale_factor;

      // Ensure the value is a precise multiple of the item.scale_factor
      const precision = item.scale_factor >= 1 ? 0 : -Math.floor(Math.log10(item.scale_factor));
      newValue = Number((Math.round(newValue / item.scale_factor) * item.scale_factor).toFixed(precision));

      // Ensure we don't go below min value
      newValue = Math.max(newValue, item.min_value);

      // Send value update to backend
      socket.emit('update_telemetry', {
        ioa: item.ioa,
        value: newValue
      });

      return newValue;
    });
  };

  const toggleAutoMode = () => {
    const newAutoMode = !isAuto;
    setAuto(newAutoMode);

    // Send updated auto_mode to backend
    socket.emit('update_telemetry', {
      ioa: item.ioa,
      auto_mode: newAutoMode
    });
  };

  return (
    <div className="p-3 flex items-center text-center border-b-2">
      <p className="font-bold w-1/3">{item.name}</p>
      <div className="flex flex-col w-1/3">
        <p className="text-2xl font-bold">
          {value} {item.unit}
        </p>
        <p className="text-sm">IOA: {item.ioa}</p>
      </div>
      <div className="flex flex-col w-1/3 gap-0.5 items-center">
        <Button
          className={`text-black bg-white rounded w-9 h-9 border-2 border-black hover:bg-gray-300 ${isAuto ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={increaseValue}
          disabled={isAuto}
        >
          +
        </Button>
        <Button
          className={`${isAuto ? 'bg-green-500 hover:bg-green-300 text-white' : 'bg-white hover:bg-gray-300 text-green-500'} rounded w-9 h-9 border-2 border-black`}
          onClick={toggleAutoMode}
        >
          A
        </Button>
        <Button
          className={`text-black bg-white rounded w-9 h-9 border-2 border-black hover:bg-gray-300 ${isAuto ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={decreaseValue}
          disabled={isAuto}
        >
          -
        </Button>
      </div>
    </div>
  )
}

export { Telemetry };