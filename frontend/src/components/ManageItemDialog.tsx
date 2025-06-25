/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { Item } from "@/lib/items";
import { AddDialog } from "./AddDialog";
import { EditDialog } from "./EditDialog";

type ManageItemDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: "add" | "edit" | "remove";
  items?: Item[];
  itemToEdit?: any;
  onSubmit: (data: any) => void;
};

export function ManageItemDialog({
  isOpen,
  onClose,
  action,
  items = [],
  itemToEdit,
  onSubmit,
}: ManageItemDialogProps) {
  // Common fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [interval, setInterval] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [itemType, setItemType] = useState("");

  // Circuit breaker fields
  const [ioaControlOpen, setIOAControlOpen] = useState("");
  const [ioaControlClose, setIOAControlClose] = useState("");
  const [ioaLocalRemoteSP, setIOALocalRemoteSP] = useState("");
  const [ioaLocalRemoteDP, setIOALocalRemoteDP] = useState("");
  const [isLocalRemoteDP, setIsLocalRemoteDP] = useState("false");
  const [isDoublePoint, setIsDoublePoint] = useState("false");
  const [addressDP, setAddressDP] = useState("");
  const [ioaCbStatusClose, setIoaCbStatusClose] = useState("");
  const [controlDP, setControlDP] = useState("");

  // Telesignal fields
  const [valTelesignal, setValTelesignal] = useState("0");

  // Telemetry fields
  const [unit, setUnit] = useState("");
  const [valTelemetry, setValTelemetry] = useState("");
  const [scaleFactor, setScaleFactor] = useState("1");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Tap Changer fields
  const [value, setValue] = useState("");
  const [valueHighLimit, setValueHighLimit] = useState("");
  const [valueLowLimit, setValueLowLimit] = useState("");
  const [ioaStatusRaiseLower, setIOAStatusRaiseLower] = useState("");
  const [ioaCommandRaiseLower, setIOACommandRaiseLower] = useState("");
  const [ioaStatusAutoManual, setIOAStatusAutoManual] = useState("");
  const [ioaCommandAutoManual, setIOACommandAutoManual] = useState("");
  const [ioaLocalRemote, setIOALocalRemote] = useState("");
  const [ioaHighLimit, setIOAHighLimit] = useState("");
  const [ioaLowLimit, setIOALowLimit] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create a bundle of props to pass to child dialogs
  const dialogProps = {
    errors,
    itemType,
    setItemType,
    name,
    setName,
    address,
    setAddress,
    interval,
    setInterval,
    ioaCbStatusClose,
    setIoaCbStatusClose,
    ioaControlOpen,
    setIOAControlOpen,
    ioaControlClose,
    setIOAControlClose,
    isDoublePoint,
    setIsDoublePoint,
    addressDP,
    setAddressDP,
    controlDP,
    setControlDP,
    ioaLocalRemoteSP,
    setIOALocalRemoteSP,
    isLocalRemoteDP,
    setIsLocalRemoteDP,
    ioaLocalRemoteDP,
    setIOALocalRemoteDP,
    valTelesignal,
    setValTelesignal,
    unit,
    setUnit,
    valTelemetry,
    setValTelemetry,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    scaleFactor,
    setScaleFactor,
    value,
    setValue,
    valueHighLimit,
    setValueHighLimit,
    valueLowLimit,
    setValueLowLimit,
    ioaHighLimit,
    setIOAHighLimit,
    ioaLowLimit,
    setIOALowLimit,
    ioaStatusRaiseLower,
    setIOAStatusRaiseLower,
    ioaCommandRaiseLower,
    setIOACommandRaiseLower,
    ioaStatusAutoManual,
    setIOAStatusAutoManual,
    ioaCommandAutoManual,
    setIOACommandAutoManual,
    ioaLocalRemote,
    setIOALocalRemote,
  };


  useEffect(() => {
    if (isOpen && action === "edit" && itemToEdit) {
      // Set form fields based on itemToEdit
      setName(itemToEdit.name || "");

      if ('ioa_cb_status' in itemToEdit) {
        // Circuit breaker
        setItemType("Circuit Breaker");
        setAddress(itemToEdit.ioa_cb_status?.toString() || "");
        setIOAControlOpen(itemToEdit.ioa_control_open?.toString() || "");
        setIOAControlClose(itemToEdit.ioa_control_close?.toString() || "");
        setIOALocalRemoteSP(itemToEdit.ioa_local_remote_sp?.toString() || "");
        setIOALocalRemoteDP(itemToEdit.ioa_local_remote_dp?.toString() || "");
        // Use the actual values from the circuit breaker
        setIsLocalRemoteDP(itemToEdit.has_local_remote_dp ? "true" : "false");
        setIsDoublePoint(itemToEdit.has_double_point ? "true" : "false");
        setAddressDP(itemToEdit.ioa_cb_status_dp?.toString() || "");
        setIoaCbStatusClose(itemToEdit.ioa_cb_status_close?.toString() || "");
        setControlDP(itemToEdit.ioa_control_dp?.toString() || "");
      } else if ('ioa' in itemToEdit && !('unit' in itemToEdit)) {
        // Telesignal
        setItemType("Telesignal");
        setAddress(itemToEdit.ioa?.toString() || "");
        setInterval(itemToEdit.interval?.toString() || "2");
        setValTelesignal(itemToEdit.value?.toString() || "0");
      } else if ('ioa' in itemToEdit && 'unit' in itemToEdit) {
        // Telemetry
        setItemType("Telemetry");
        setAddress(itemToEdit.ioa?.toString() || "");
        setInterval(itemToEdit.interval?.toString() || "2");
        setUnit(itemToEdit.unit || "");
        setValTelemetry(itemToEdit.value?.toString() || "0");
        setScaleFactor(itemToEdit.scale_factor?.toString() || "1");
        setMinValue(itemToEdit.min_value?.toString() || "0");
        setMaxValue(itemToEdit.max_value?.toString() || "100");
      } else if ('ioa_value' in itemToEdit) {
        // Tap Changer
        setItemType("Tap Changer");
        setAddress(itemToEdit.ioa_value?.toString() || "");
        setInterval(itemToEdit.interval?.toString() || "");
        setValue(itemToEdit.value?.toString() || "");
        setIOAHighLimit(itemToEdit.ioa_high_limit?.toString() || "");
        setIOALowLimit(itemToEdit.ioa_low_limit?.toString() || "");
        setValueHighLimit(itemToEdit.value_high_limit?.toString() || "");
        setValueLowLimit(itemToEdit.value_low_limit?.toString() || "");
        setIOAStatusRaiseLower(itemToEdit.ioa_status_raise_lower?.toString() || "");
        setIOACommandRaiseLower(itemToEdit.ioa_command_raise_lower?.toString() || "");
        setIOAStatusAutoManual(itemToEdit.ioa_status_auto_manual?.toString() || "");
        setIOACommandAutoManual(itemToEdit.ioa_command_auto_manual?.toString() || "");
        setIOALocalRemote(itemToEdit.ioa_local_remote?.toString() || "");
      }
    } else if (isOpen && action !== "edit") {
      // Reset form when opening for add/remove
      resetForm();
    }
  }, [isOpen, action, itemToEdit]);

  const resetForm = () => {
    setName("");
    setAddress("");
    setInterval("");
    setSelectedItem("");
    setItemType("");
    setIOAControlOpen("");
    setIOAControlClose("");
    setIOALocalRemoteSP("");
    setAddressDP("");
    setIoaCbStatusClose("");
    setControlDP("");
    setValTelesignal("0");
    setUnit("");
    setValTelemetry("");
    setScaleFactor("1");
    setMinValue("");
    setMaxValue("");
    setErrors({});
    setIsDoublePoint("false");
    setIsLocalRemoteDP("false");
    setIOALocalRemoteDP("");
    setValue("");
    setValueHighLimit("");
    setValueLowLimit("");
    setIOAHighLimit("");
    setIOALowLimit("");
    setIOAStatusRaiseLower("");
    setIOACommandRaiseLower("");
    setIOAStatusAutoManual("");
    setIOACommandAutoManual("");
    setIOALocalRemote("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (
      action === "add" &&
      items.some(item => item.name.toLowerCase() === name.toLowerCase())
    ) {
      newErrors.name = "Name already exists";
    } else if (action === "edit" && itemToEdit && items.some(item => item.id !== itemToEdit.id && item.name.toLowerCase() === name.toLowerCase())) {
      newErrors.name = "Name already exists";
    }


    if (!address) {
      newErrors.address = "Address/IOA is required";
    } else if (isNaN(Number(address))) {
      newErrors.address = "Address/IOA must be a number";
    } else if (
      action === "add" &&
      itemType === "Circuit Breaker" &&
      items.some((item: any) => {
        // Check if any other circuit breaker has the same address
        return 'ioa_cb_status' in item && item.ioa_cb_status === Number(address);
      })
    ) {
      newErrors.address = "Address/IOA already in use";
    } else if (
      action === "add" &&
      itemType === "Telesignal" &&
      items.some((item: any) => {
        // Check if any other telesignal has the same address
        return 'ioa' in item && !('unit' in item) && item.ioa === Number(address);
      })
    ) {
      newErrors.address = "Address/IOA already in use";
    } else if (
      action === "add" &&
      itemType === "Telemetry" &&
      items.some((item: any) => {
        // Check if any other telemetry has the same address
        return 'ioa' in item && 'unit' in item && item.ioa === Number(address);
      })
    ) {
      newErrors.address = "Address/IOA already in use";
    }

    // Common validation for interval (for Telesignal and Telemetry)
    if (itemType !== "Circuit Breaker" && (!interval || isNaN(Number(interval)) || Number(interval) <= 0)) {
      newErrors.interval = "Valid interval is required (must be greater than 0)";
    }

    // Circuit breaker specific validations
    if (itemType === "Circuit Breaker") {
      if (!ioaControlOpen) {
        newErrors.ioaControlOpen = "IOA Control Open is required";
      } else if (isNaN(Number(ioaControlOpen))) {
        newErrors.ioaControlOpen = "IOA Control Open must be a number";
      } else if (
        action === "add" &&
        items.some((item: any) => 'ioa_control_open' in item && item.ioa_control_open === Number(ioaControlOpen))
      ) {
        newErrors.ioaControlOpen = "IOA Control Open already in use";
      }

      if (!ioaControlClose) {
        newErrors.ioaControlClose = "IOA Control Close is required";
      } else if (isNaN(Number(ioaControlClose))) {
        newErrors.ioaControlClose = "IOA Control Close must be a number";
      } else if (
        action === "add" &&
        items.some((item: any) => 'ioa_control_close' in item && item.ioa_control_close === Number(ioaControlClose))
      ) {
        newErrors.ioaControlClose = "IOA Control Close already in use";
      }

      if (!ioaLocalRemoteSP) {
        newErrors.ioaLocalRemoteSP = "IOA Local Remote SP is required";
      } else if (isNaN(Number(ioaLocalRemoteSP))) {
        newErrors.ioaLocalRemoteSP = "IOA Local Remote SP must be a number";
      } else if (
        action === "add" &&
        items.some((item: any) => 'ioa_local_remote_sp' in item && item.ioa_local_remote_sp === Number(ioaLocalRemoteSP))
      ) {
        newErrors.ioaLocalRemoteSP = "IOA Local Remote already in use";
      }

      if (isLocalRemoteDP === "true") {
        if (!ioaLocalRemoteDP) {
          newErrors.ioaLocalRemoteDP = "IOA Local Remote DP is required";
        } else if (isNaN(Number(ioaLocalRemoteDP))) {
          newErrors.ioaLocalRemoteDP = "IOA Local Remote DP must be a number";
        } else if (
          action === "add" &&
          items.some((item: any) => 'ioa_local_remote_dp' in item && item.ioa_local_remote_dp === Number(ioaLocalRemoteDP))
        ) {
          newErrors.ioaLocalRemoteDP = "IOA Local Remote DP already in use";
        }
      }

      if (!ioaCbStatusClose) {
        newErrors.ioaCbStatusClose = "IOA CB Status Close is required";
      } else if (isNaN(Number(ioaCbStatusClose))) {
        newErrors.ioaCbStatusClose = "IOA CB Status Close must be a number";
      }

      if (isDoublePoint === "true") {
        if (!addressDP) {
          newErrors.addressDP = "Double point address/IOA is required";
        } else if (isNaN(Number(addressDP))) {
          newErrors.addressDP = "Double point address/IOA must be a number";
        } else if (
          action === "add" &&
          items.some((item: any) => 'ioa_cb_status_dp' in item && item.ioa_cb_status_dp === Number(addressDP))
        ) {
          newErrors.addressDP = "Double point address/IOA already in use";
        }

        if (!controlDP) {
          newErrors.controlDP = "Control Double Point address is required";
        } else if (isNaN(Number(controlDP))) {
          newErrors.controlDP = "Control Double Point address must be a number";
        }
      }
    }

    // Telemetry specific validations
    if (itemType === "Telemetry") {
      if (!unit.trim()) {
        newErrors.unit = "Unit is required";
      }

      if (valTelemetry === "" || isNaN(Number(valTelemetry))) {
        newErrors.valTelemetry = "Valid value is required";
      }

      if (scaleFactor === "" || isNaN(Number(scaleFactor)) || Number(scaleFactor) <= 0) {
        newErrors.scaleFactor = "Valid scale factor is required (must be greater than 0)";
      }

      if (minValue === "" || isNaN(Number(minValue))) {
        newErrors.minValue = "Valid minimum value is required";
      }

      if (maxValue === "" || isNaN(Number(maxValue))) {
        newErrors.maxValue = "Valid maximum value is required";
      }

      if (Number(minValue) >= Number(maxValue)) {
        newErrors.range = "Maximum value must be greater than minimum value";
      }
    }

    if (itemType === "Tap Changer") {
      if (!address) {
        newErrors.address = "Address is required";
      } else if (isNaN(Number(address))) {
        newErrors.address = "Address must be a number";
      }

      if (value === "" || isNaN(Number(value))) {
        newErrors.value = "Valid value is required";
      }

      if (!valueHighLimit) {
        newErrors.valueHighLimit = "Value High Limit is required";
      } else if (isNaN(Number(valueHighLimit))) {
        newErrors.valueHighLimit = "Value High Limit must be a number";
      }

      if (!valueLowLimit) {
        newErrors.valueLowLimit = "Value Low Limit is required";
      } else if (isNaN(Number(valueLowLimit))) {
        newErrors.valueLowLimit = "Value Low Limit must be a number";
      }

      if (Number(valueLowLimit) >= Number(valueHighLimit)) {
        newErrors.range = "Value High Limit must be greater than Value Low Limit";
      }

      if (!ioaHighLimit) {
        newErrors.ioaHighLimit = "IOA High Limit is required";
      } else if (isNaN(Number(ioaHighLimit))) {
        newErrors.ioaHighLimit = "IOA High Limit must be a number";
      }

      if (!ioaLowLimit) {
        newErrors.ioaLowLimit = "IOA Low Limit is required";
      } else if (isNaN(Number(ioaLowLimit))) {
        newErrors.ioaLowLimit = "IOA Low Limit must be a number";
      }

      if (!ioaStatusRaiseLower) {
        newErrors.ioaStatusRaiseLower = "IOA Status Raise/Lower is required";
      } else if (isNaN(Number(ioaStatusRaiseLower))) {
        newErrors.ioaStatusRaiseLower = "IOA Status Raise/Lower must be a number";
      }

      if (!ioaStatusRaiseLower) {
        newErrors.ioaStatusRaiseLower = "IOA Status Raise/Lower is required";
      } else if (isNaN(Number(ioaStatusRaiseLower))) {
        newErrors.ioaStatusRaiseLower = "IOA Status Raise/Lower must be a number";
      }

      if (!ioaCommandRaiseLower) {
        newErrors.ioaCommandRaiseLower = "IOA Command Raise/Lower is required";
      } else if (isNaN(Number(ioaCommandRaiseLower))) {
        newErrors.ioaCommandRaiseLower = "IOA Command Raise/Lower must be a number";
      }

      if (!ioaStatusAutoManual) {
        newErrors.ioaStatusAutoManual = "IOA Status Auto/Manual is required";
      } else if (isNaN(Number(ioaStatusAutoManual))) {
        newErrors.ioaStatusAutoManual = "IOA Status Auto/Manual must be a number";
      }

      if (!ioaCommandAutoManual) {
        newErrors.ioaCommandAutoManual = "IOA Command Auto/Manual is required";
      } else if (isNaN(Number(ioaCommandAutoManual))) {
        newErrors.ioaCommandAutoManual = "IOA Command Auto/Manual must be a number";
      }

      if (!ioaLocalRemote) {
        newErrors.ioaLocalRemote = "IOA Local/Remote is required";
      } else if (isNaN(Number(ioaLocalRemote))) {
        newErrors.ioaLocalRemote = "IOA Local/Remote must be a number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const commonData = action === "edit" && itemToEdit ? { id: itemToEdit.id } : {};

    if (action === "add" || action === "edit") {
      let submissionData: any;
      if (itemType === "Circuit Breaker") {
        const isDP = isDoublePoint === "true";
        const isLRDP = isLocalRemoteDP === "true";
        submissionData = {
          name,
          ioa_cb_status: parseInt(address),
          ioa_cb_status_close: parseInt(ioaCbStatusClose),
          ioa_control_open: parseInt(ioaControlOpen),
          ioa_control_close: parseInt(ioaControlClose),
          ioa_local_remote_sp: parseInt(ioaLocalRemoteSP),
          has_local_remote_dp: isLRDP,
          ioa_local_remote_dp: isLRDP ? parseInt(ioaLocalRemoteDP) : undefined,
          has_double_point: isDP,
          ioa_cb_status_dp: isDP ? parseInt(addressDP) : undefined,
          ioa_control_dp: isDP ? parseInt(controlDP) : undefined,
        };
      } else if (itemType === "Telesignal") {
        submissionData = {
          name,
          ioa: parseInt(address),
          interval: parseInt(interval),
          value: parseInt(valTelesignal),
        };
      } else if (itemType === "Telemetry") {
        submissionData = {
          name,
          ioa: parseInt(address),
          unit,
          value: parseFloat(valTelemetry),
          scale_factor: parseFloat(scaleFactor),
          min_value: parseFloat(minValue),
          max_value: parseFloat(maxValue),
          interval: parseInt(interval)
        };
      } else if (itemType === "Tap Changer") {
        submissionData = {
          name,
          ioa_value: parseInt(address),
          value: parseInt(value),
          value_high_limit: parseInt(valueHighLimit),
          value_low_limit: parseInt(valueLowLimit),
          ioa_high_limit: parseInt(ioaHighLimit),
          ioa_low_limit: parseInt(ioaLowLimit),
          ioa_status_raise_lower: parseInt(ioaStatusRaiseLower),
          ioa_command_raise_lower: parseInt(ioaCommandRaiseLower),
          ioa_status_auto_manual: parseInt(ioaStatusAutoManual),
          ioa_command_auto_manual: parseInt(ioaCommandAutoManual),
          ioa_local_remote: parseInt(ioaLocalRemote),
          interval: parseInt(interval),
          ...commonData
        };
      }
      onSubmit({ ...commonData, ...submissionData });
    } else {
      onSubmit({ id: selectedItem });
      setSelectedItem("");
    }

    onClose();
  };


  const getDialogTitle = () => {
    switch (action) {
      case "add": return "Add new item";
      case "edit": return "Edit item";
      case "remove": return "Remove item";
      default: return "Manage item";
    }
  };

  return (
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {action === "add" ? (
              <AddDialog {...dialogProps} />
            ) : action === "edit" ? (
              <EditDialog {...dialogProps} />
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                type="submit"
                variant={action === "remove" ? "destructive" : "default"}
                disabled={(action === "add" && !itemType) || (action === "remove" && !selectedItem)}
              >
                {action === "add" ? "Add" : action === "edit" ? "Save" : "Remove"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}