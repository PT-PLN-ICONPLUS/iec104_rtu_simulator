// frontend/src/components/TeleSignalItem.tsx
import { Button } from "./ui/button";
import { useEffect, useState } from 'react';
import socket from '../socket';
import { TeleSignalItem } from "@/lib/items";

function TeleSignal(item: TeleSignalItem) {
  const [isOn, setIsOn] = useState(item.value === 1); // value: 0 is off, 1 is on
  const [isAuto, setAuto] = useState(item.auto_mode);

  useEffect(() => {
    const handleUpdate = (data: TeleSignalItem[]) => {
      // Filter the data to find the specific item based on ioa
      const filtered = data.filter((look: TeleSignalItem) => look.ioa === item.ioa);

      if (filtered[0].ioa === item.ioa) {
        setIsOn(filtered[0].value === 1);
        setAuto(filtered[0].auto_mode);
      }
    }

    socket.on('telesignals', handleUpdate);
    return () => {
      socket.off('telesignals', handleUpdate);
    }
  }, [item.ioa]);

  const toggleValue = () => {
    if (isAuto) return; // Prevent manual toggling in auto mode

    const newValue = isOn ? 0 : 1;
    setIsOn(!isOn);

    if (!isAuto) {
      socket.emit('update_telesignal', {
        ioa: item.ioa,
        value: newValue
      });
    }
  };

  const toggleAutoMode = () => {
    const newAutoMode = !isAuto;
    setAuto(newAutoMode);

    socket.emit('update_telesignal', {
      ioa: item.ioa,
      auto_mode: newAutoMode,
    });
  };

  return (
    <div className="p-3 flex items-center text-center border">
      <p className="font-bold w-1/3">{item.name}</p>
      <div className="flex flex-col w-1/3">
        <p className={`${isOn ? 'text-green-500' : 'text-red-500'} text-2xl font-bold`}>
          {isOn ? 'ON' : 'OFF'}
        </p>
        <p className="text-sm">IOA: {item.ioa}</p>
      </div>
      <div className="flex flex-col w-1/3 gap-0.5 items-center">
        <Button
          className={`${isAuto ? 'bg-green-500 hover:bg-green-300' : 'bg-white hover:hover:bg-gray-300'} text-${isAuto ? 'white' : 'green-500'} rounded w-9 h-9  border-2 border-black`}
          onClick={toggleAutoMode}
        >
          A
        </Button>
        <Button
          className={`${isOn ? 'bg-green-500' : 'bg-red-500'} text-white rounded w-9 h-9  border-2 border-black`}
          onClick={toggleValue}
          disabled={isAuto}
        >
          {isOn ? 'ON' : 'OFF'}
        </Button>
      </div>
    </div>
  )
}

export { TeleSignal };