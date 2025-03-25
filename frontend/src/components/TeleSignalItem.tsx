// frontend/src/components/TeleSignalItem.tsx
import { Button } from "./ui/button";
import { useEffect, useState } from 'react';
import socket from '../socket';

interface TeleSignalProps {
  name: string;
  ioa: number; // ioa
  value: number; // 0 is off, 1 is on
}

function TeleSignal({ name = "Test", ioa = 117, value = 0 }: TeleSignalProps) {
  const [isOn, setIsOn] = useState(value === 1); // value: 0 is off, 1 is on
  const [isAuto, setAuto] = useState(false);

  useEffect(() => {
    setIsOn(value === 1);
  }, [value]);

  useEffect(() => {
    socket.emit('update_telesignal', {
      ioa,
      auto_mode: isAuto,
      value: isOn ? 1 : 0
    });
  }, [isAuto, ioa, isOn]);

  const toggleValue = () => {
    const newValue = isOn ? 0 : 1;
    setIsOn(!isOn);

    if (!isAuto) {
      socket.emit('update_telesignal', {
        ioa,
        value: newValue
      });
    }
  };

  return (
    <div className="p-3 flex items-center text-center border">
      <p className="font-bold w-1/3">{name}</p>
      <div className="flex flex-col w-1/3">
        <p className={`${isOn ? 'text-green-500' : 'text-red-500'} text-2xl font-bold`}>
          {isOn ? 'ON' : 'OFF'}
        </p>
        <p className="text-sm">IOA: {ioa}</p>
      </div>
      <div className="flex flex-col w-1/3 gap-0.5 items-center">
        <Button
          className={`${isAuto ? 'bg-green-500 hover:bg-green-300' : 'bg-white hover:hover:bg-gray-300'} text-${isAuto ? 'white' : 'green-500'} rounded w-9 h-9  border-2 border-black`}
          onClick={() => setAuto(!isAuto)}
        >
          A
        </Button>
        <Button
          className={`${isOn ? 'bg-green-500' : 'bg-red-500'} text-white rounded w-9 h-9  border-2 border-black`}
          onClick={toggleValue}
        >
          {isOn ? 'ON' : 'OFF'}
        </Button>
      </div>
    </div>
  )
}

export { TeleSignal };