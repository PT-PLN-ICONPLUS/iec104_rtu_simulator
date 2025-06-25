import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import socket from "../socket";
import { TapChangerItem } from "@/lib/items";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

function TapChanger(item: TapChangerItem & {
  isEditing: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [value, setValue] = useState(item.value);
  const [auto, setAuto] = useState(item.auto_mode);
  const [isRemote, setIsRemote] = useState(item.is_local_remote);

  useEffect(() => {
    const handleUpdate = (data: TapChangerItem[]) => {
      // Filter the data to find the specific item based on id
      const filtered = data.filter((look: TapChangerItem) => look.id === item.id);
      if (filtered.length > 0 && filtered[0].id === item.id) {
        setValue(filtered[0].value);
        setAuto(filtered[0].auto_mode);
        setIsRemote(filtered[0].is_local_remote);
      }
    }

    socket.on('tap_changers', handleUpdate);
    return () => {
      socket.off('tap_changers', handleUpdate);
    }
  }, [item.id]);

  const handleValue = (type: string) => {
    let newValue = 0;

    if (type === "+") {
      newValue = value + 1;
    } else if (type === "-") {
      newValue = value - 1;
    }

    if (newValue < item.value_low_limit || newValue > item.value_high_limit) {
      newValue = value;
    }

    setValue(newValue);
    socket.emit('update_tap_changer', {
      id: item.id,
      value: newValue
    })
  }

  const handleAutoMode = () => {
    const newAuto = auto === true ? false : true;

    setAuto(newAuto);
    socket.emit('update_tap_changer', {
      id: item.id,
      auto_mode: newAuto
    });
  }

  const setLR = () => {
    const newLocalRemote = isRemote == 1 ? 2 : 1;
    setIsRemote(newLocalRemote);

    socket.emit('update_tap_changer', {
      id: item.id,
      is_local_remote: newLocalRemote
    });
  };

  return (
    <div>
      <div className="text-center py-2 border-b">
        <p className="font-bold text-lg">{item.name}</p>
      </div>
      <div className="flex flex-row border-b-2 py-2 mb-1.5">
        <div className="flex flex-col my-2 mx-6 gap-2">
          {/* Display Value */}
          <div className="flex flex-row">
            <div className="flex w-full justify-around text-6xl">
              <p>{value}</p>
            </div>
          </div>

          {/* Raise Lower Buttons */}
          <div className="flex flex-row gap-4 justify-around my-1">
            <Button
              onClick={() => handleValue("+")}
              className={`text-xs w-12 h-12 rounded-full flex items-center justify-center bg-green-600 border-2 border-black ${(isRemote === 2) || item.isEditing ? 'opacity-50' : ''
                }`}
              disabled={isRemote === 2 || item.isEditing}
            >
              Raise
            </Button>

            <Button
              onClick={() => handleValue("-")}
              className={`text-xs w-12 h-12 rounded-full flex items-center justify-center bg-red-600 border-2 border-black ${(isRemote === 2) || item.isEditing ? 'opacity-50' : ''
                }`}
              disabled={isRemote === 2 || item.isEditing}
            >
              Lower
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-4 px-4">
            <div className="text-sm flex flex-col">
              <p>IOA Status Raise Lower: <span className="font-bold">{item.ioa_status_raise_lower}</span></p>
              <p>IOA Command Raise Lower: <span className="font-bold">{item.ioa_command_raise_lower}</span></p>
              <p>IOA Status Auto Manual: <span className="font-bold">{item.ioa_status_auto_manual}</span></p>
              <p>IOA Command Auto Manual: <span className="font-bold">{item.ioa_command_auto_manual}</span></p>
            </div>

            <div className="text-sm flex flex-col">
              <p>IOA Value: <span className="font-bold">{item.ioa_value}</span></p>
              <p>Value Low Limit: <span className="font-bold">{item.value_low_limit}</span></p>
              <p>Value High Limit: <span className="font-bold">{item.value_high_limit}</span></p>
              <p>IOA Local Remote:<span className="font-bold"> {item.ioa_local_remote}</span></p>
            </div>
          </div>

          {/* Local/Remote switch and Auto*/}
          {item.isEditing ? (
            <div className="flex flex-row gap-2 items-center justify-center">
              <Button
                size="sm"
                className={`bg-white text-blue-500 rounded w-9 h-9 border-2 border-black hover:bg-gray-300}`}
                onClick={() => item.onEdit && item.onEdit(item.id)}
              >
                <FiEdit2 />
              </Button>
              <Button
                size="sm"
                className={`bg-white text-red-500 rounded w-9 h-9 border-2 border-black hover:bg-gray-300}`}
                onClick={() => item.onDelete && item.onDelete(item.id)}
              >
                <FiTrash2 />
              </Button>
            </div>
          ) : (
            <div className="flex flex-row gap-4 items-center justify-center">
              <span className={`font-bold ${isRemote !== 2 ? 'text-red-500' : ''}`}>L</span>
              <Switch
                id={`location-mode-${item.id}`}
                checked={isRemote === 2}
                onCheckedChange={setLR}
                disabled={item.isEditing}
              />
              <span className={`font-bold ${isRemote === 2 ? 'text-red-500' : ''}`}>R</span>
              <Button
                className={`${auto ? 'bg-green-500 hover:bg-green-300' : 'bg-white hover:hover:bg-gray-300'} text-${auto ? 'white' : 'green-500'} rounded w-8 h-8 border-2 border-black`}
                onClick={handleAutoMode}
                disabled={item.isEditing || isRemote === 2}
              >
                A
              </Button>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

export { TapChanger };