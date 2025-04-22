/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { Item } from "@/lib/items";

type ManageItemDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: "add" | "remove";
  itemType: string;
  items?: Item[];
  onSubmit: (data: any) => void;
};

export function ManageItemDialog({
  isOpen,
  onClose,
  title,
  action,
  itemType,
  items = [],
  onSubmit,
}: ManageItemDialogProps) {
  // Common fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [interval, setInterval] = useState("5");
  const [selectedItem, setSelectedItem] = useState("");

  // Circuit breaker fields
  const [ioaControlOpen, setIOAControlOpen] = useState("");
  const [ioaControlClose, setIOAControlClose] = useState("");
  const [ioaLocalRemote, setIOALocalRemote] = useState("");
  const [isDoublePoint, setIsDoublePoint] = useState("false");
  const [addressDP, setAddressDP] = useState("");
  const [ioaCbStatusClose, setIoaCbStatusClose] = useState("");
  const [controlDP, setControlDP] = useState("");

  // Telesignal fields
  const [valTelesignal, setValTelesignal] = useState("");

  // Telemetry fields
  const [unit, setUnit] = useState("");
  const [valTelemetry, setValTelemetry] = useState("");
  const [scaleFactor, setScaleFactor] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form on open/close
  useEffect(() => {
    if (isOpen) {
      // Keep defaults
      setScaleFactor("1");
      // Default valTelemetry based on min and max if they're set

    } else {
      // Reset form
      setName("");
      setAddress("");
      setInterval("2");
      setSelectedItem("");
      setIOAControlOpen("");
      setIOAControlClose("");
      setIOALocalRemote("");
      setIsDoublePoint("false");
      setAddressDP("");
      setIoaCbStatusClose("");
      setControlDP("");
      setUnit("");
      setMinValue("");
      setMaxValue("");
      setErrors({});
      setValTelemetry("");
    }
  }, [isOpen, minValue, maxValue]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // For remove action, only validate selectedItem
    if (action === "remove") {
      if (!selectedItem) {
        newErrors.selectedItem = "Please select an item to remove";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Common validations
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (
      action === "add" &&
      items.some(item => item.name.toLowerCase() === name.toLowerCase())
    ) {
      newErrors.name = "Name already exists";
    }

    if (!address) {
      newErrors.address = "Address/IOA is required";
    } else if (isNaN(Number(address))) {
      newErrors.address = "Address/IOA must be a number";
    } else if (
      action === "add" &&
      itemType === "Circuit Breakers" &&
      items.some((item: any) => item.ioa_cb_status === Number(address))
    ) {
      newErrors.address = "Address/IOA already in use";
    } else if (
      action === "add" &&
      itemType === "Telesignals" &&
      items.some((item: any) => item.ioa === Number(address))
    ) {
      newErrors.address = "Address/IOA already in use";
    } else if (
      action === "add" &&
      itemType === "Telemetry" &&
      items.some((item: any) => item.ioa === Number(address))
    ) {
      newErrors.address = "Address/IOA already in use";
    }

    if (!interval || isNaN(Number(interval)) || Number(interval) <= 0) {
      newErrors.interval = "Valid interval is required";
    }

    // Circuit breaker specific validations
    if (itemType === "Circuit Breakers") {
      if (!ioaControlOpen) {
        newErrors.ioaControlOpen = "IOA Control Open is required";
      } else if (isNaN(Number(ioaControlOpen))) {
        newErrors.ioaControlOpen = "IOA Control Open must be a number";
      } else if (
        action === "add" &&
        items.some((item: any) => item.ioa_control_open === Number(ioaControlOpen))
      ) {
        newErrors.ioaControlOpen = "IOA Control Open already in use";
      }

      if (!ioaControlClose) {
        newErrors.ioaControlClose = "IOA Control Close is required";
      } else if (isNaN(Number(ioaControlClose))) {
        newErrors.ioaControlClose = "IOA Control Close must be a number";
      } else if (
        action === "add" &&
        items.some((item: any) => item.ioa_control_close === Number(ioaControlClose))
      ) {
        newErrors.ioaControlClose = "IOA Control Close already in use";
      }

      if (!ioaLocalRemote) {
        newErrors.ioaLocalRemote = "IOA Local Remote is required";
      } else if (isNaN(Number(ioaLocalRemote))) {
        newErrors.ioaLocalRemote = "IOA Local Remote must be a number";
      } else if (
        action === "add" &&
        items.some((item: any) => item.ioa_local_remote === Number(ioaLocalRemote))
      ) {
        newErrors.ioaLocalRemote = "IOA Local Remote already in use";
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
          items.some((item: any) => item.ioa_data_dp === Number(addressDP))
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

      if (!valTelemetry || isNaN(Number(valTelemetry))) {
        newErrors.valTelemetry = "Valid value is required";
      }

      if (!scaleFactor || isNaN(Number(scaleFactor))) {
        newErrors.scaleFactor = "Valid scale factor is required";
      }

      if (!minValue || isNaN(Number(minValue))) {
        newErrors.minValue = "Valid minimum value is required";
      }

      if (!maxValue || isNaN(Number(maxValue))) {
        newErrors.maxValue = "Valid maximum value is required";
      }

      if (Number(minValue) >= Number(maxValue)) {
        newErrors.range = "Maximum value must be greater than minimum value";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Display general error toast
      toast.error("Please fix the errors in the form");
      return;
    }

    if (action === "add") {
      if (itemType === "Circuit Breakers") {
        const isDP = isDoublePoint === "true";
        onSubmit({
          name,
          ioa_cb_status: parseInt(address),
          ioa_cb_status_close: parseInt(ioaCbStatusClose),
          ioa_control_open: parseInt(ioaControlOpen),
          ioa_control_close: parseInt(ioaControlClose),
          ioa_local_remote: parseInt(ioaLocalRemote),
          is_double_point: isDP,
          ioa_cb_status_dp: isDP ? parseInt(addressDP) : undefined,
          ioa_control_dp: isDP ? parseInt(controlDP) : undefined,
          remote: 0,  // Default to local mode
          interval: parseInt(interval),
        });
      } else if (itemType === "Telesignals") {
        onSubmit({
          name,
          ioa: parseInt(address),
          interval: parseInt(interval),
          value: parseInt(valTelesignal),
        });
      } else if (itemType === "Telemetry") {
        onSubmit({
          name,
          ioa: parseInt(address),
          unit,
          value: parseFloat(valTelemetry),
          scale_factor: parseFloat(scaleFactor),
          min_value: parseFloat(minValue),
          max_value: parseFloat(maxValue),
          interval: parseInt(interval)
        });
      }
    } else {
      onSubmit({ id: selectedItem });
      setSelectedItem("");
    }

    onClose();
  };

  return (
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {action === "add" ? (
              <>
                <div className="flex w-full items-center gap-1.5">
                  <Label htmlFor="name" className="w-1/3">Name</Label>
                  <input
                    type="text"
                    id="name"
                    className={`w-2/3 border rounded p-2 ${errors.name ? "border-red-500" : ""}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>

                {itemType !== "Circuit Breakers" && (
                  <div className="flex w-full items-center gap-1.5">
                    <Label htmlFor="interval" className="w-1/3">Interval (s)</Label>
                    <input
                      type="number"
                      id="interval"
                      className={`border rounded p-2 w-2/3 ${errors.interval ? "border-red-500" : ""}`}
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                    />
                    {errors.interval && <p className="text-red-500 text-xs">{errors.interval}</p>}
                  </div>
                )}

                <div className="flex w-full items-center gap-1.5">
                  <Label htmlFor="address" className="w-1/3">
                    {itemType === "Circuit Breakers" ? "IOA CB Status Open" : "Address/IOA"}
                  </Label>
                  <input
                    type="number"
                    id="address"
                    className={`border rounded p-2 w-2/3 ${errors.address ? "border-red-500" : ""}`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                </div>

                {itemType === "Circuit Breakers" && (
                  <>
                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="ioaCbStatusClose" className="w-1/3">
                        IOA CB Status Close
                      </Label>
                      <input
                        type="number"
                        id="ioaCbStatusClose"
                        className={`border rounded p-2 w-2/3 ${errors.ioaCbStatusClose ? "border-red-500" : ""}`}
                        value={ioaCbStatusClose}
                        onChange={(e) => setIoaCbStatusClose(e.target.value)}
                      />
                      {errors.ioaCbStatusClose && <p className="text-red-500 text-xs">{errors.ioaCbStatusClose}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="ioaControlOpen" className="w-1/3">
                        IOA Control Open
                      </Label>
                      <input
                        type="number"
                        id="ioaControlOpen"
                        className={`border rounded p-2 w-2/3 ${errors.ioaControlOpen ? "border-red-500" : ""}`}
                        value={ioaControlOpen}
                        onChange={(e) => setIOAControlOpen(e.target.value)}
                      />
                      {errors.ioaControlOpen && <p className="text-red-500 text-xs">{errors.ioaControlOpen}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="ioaControlClose" className="w-1/3">
                        IOA Control Close
                      </Label>
                      <input
                        type="number"
                        id="ioaControlClose"
                        className={`border rounded p-2 w-2/3 ${errors.ioaControlClose ? "border-red-500" : ""}`}
                        value={ioaControlClose}
                        onChange={(e) => setIOAControlClose(e.target.value)}
                      />
                      {errors.ioaControlClose && <p className="text-red-500 text-xs">{errors.ioaControlClose}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label className="w-1/3">Double Point</Label>
                      <RadioGroup
                        value={isDoublePoint}
                        onValueChange={setIsDoublePoint}
                        defaultValue="false"
                      >
                        <div className="flex flex-row gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="dp-yes" />
                            <Label htmlFor="dp-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="dp-no" />
                            <Label htmlFor="dp-no">No</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    {isDoublePoint === "true" && (
                      <>
                        <div className="flex w-full items-center gap-1.5">
                          <Label htmlFor="address-dp" className="w-1/3">IOA CB Status Double Point</Label>
                          <input
                            type="number"
                            id="address-dp"
                            className={`border rounded p-2 w-2/3 ${errors.addressDP ? "border-red-500" : ""}`}
                            value={addressDP}
                            onChange={(e) => setAddressDP(e.target.value)}
                          />
                          {errors.addressDP && <p className="text-red-500 text-xs">{errors.addressDP}</p>}
                        </div>
                        <div className="flex w-full items-center gap-1.5">
                          <Label htmlFor="control-dp" className="w-1/3">IOA Control Double Point</Label>
                          <input
                            type="number"
                            id="control-dp"
                            className={`border rounded p-2 w-2/3 ${errors.controlDP ? "border-red-500" : ""}`}
                            value={controlDP}
                            onChange={(e) => setControlDP(e.target.value)}
                          />
                          {errors.controlDP && <p className="text-red-500 text-xs">{errors.controlDP}</p>}
                        </div>
                      </>
                    )}

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="ioaLocalRemote" className="w-1/3">
                        IOA Local/Remote
                      </Label>
                      <input
                        type="number"
                        id="ioaLocalRemote"
                        className={`border rounded p-2 w-2/3 ${errors.ioaLocalRemote ? "border-red-500" : ""}`}
                        value={ioaLocalRemote}
                        onChange={(e) => setIOALocalRemote(e.target.value)}
                      />
                      {errors.ioaLocalRemote && <p className="text-red-500 text-xs">{errors.ioaLocalRemote}</p>}
                    </div>
                  </>
                )}

                {itemType === "Telesignals" && (
                  <div className="flex w-full items-center gap-1.5">
                    <Label htmlFor="value_telesignal" className="w-1/3">Value</Label>
                    <RadioGroup
                      value={valTelesignal}
                      onValueChange={setValTelesignal}
                      defaultValue="0"
                    >
                      <div className="flex flex-row gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="on" />
                          <Label htmlFor="on">ON</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id="off" />
                          <Label htmlFor="off">OFF</Label>
                        </div>
                      </div>
                    </RadioGroup>
                    {errors.valTelesignal && <p className="text-red-500 text-xs">{errors.valTelesignal}</p>}
                  </div>
                )}

                {itemType === "Telemetry" && (
                  <>
                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="unit" className="w-1/3">Unit</Label>
                      <input
                        type="text"
                        id="unit"
                        className={`border rounded p-2 w-2/3 ${errors.unit ? "border-red-500" : ""}`}
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                      {errors.unit && <p className="text-red-500 text-xs">{errors.unit}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="value_telemetry" className="w-1/3">Value</Label>
                      <input
                        type="number"
                        id="value_telemetry"
                        className={`border rounded p-2 w-2/3 ${errors.unit ? "border-red-500" : ""}`}
                        value={valTelemetry}
                        onChange={(e) => setValTelemetry(e.target.value)}
                      />
                      {errors.valTelemetry && <p className="text-red-500 text-xs">{errors.valTelemetry}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="min-value" className="w-1/3">Min Value</Label>
                      <input
                        type="number"
                        id="min-value"
                        className={`border rounded p-2 w-2/3 ${errors.minValue ? "border-red-500" : ""}`}
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                        step="any"
                      />
                      {errors.minValue && <p className="text-red-500 text-xs">{errors.minValue}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="max-value" className="w-1/3">Max Value</Label>
                      <input
                        type="number"
                        id="max-value"
                        className={`border rounded p-2 w-2/3 ${errors.maxValue ? "border-red-500" : ""}`}
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                        step="any"
                      />
                      {errors.maxValue && <p className="text-red-500 text-xs">{errors.maxValue}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="scale-factor" className="w-1/3">Scale Factor</Label>
                      <select
                        id="scale-factor"
                        className={`border rounded p-2 w-2/3 ${errors.scaleFactor ? "border-red-500" : ""}`}
                        value={scaleFactor}
                        onChange={(e) => setScaleFactor(e.target.value)}
                      >
                        <option value="1">1</option>
                        <option value="0.1">0.1</option>
                        <option value="0.01">0.01</option>
                        <option value="0.001">0.001</option>
                      </select>
                      {errors.scaleFactor && <p className="text-red-500 text-xs">{errors.scaleFactor}</p>}
                    </div>

                    {errors.range && <p className="text-red-500 text-xs">{errors.range}</p>}
                  </>
                )}
              </>
            ) : (
              <div className="flex w-full items-center gap-1.5">
                <Label htmlFor="item" className="w-1/3">Select {itemType} to remove</Label>
                <select
                  id="item"
                  className={`border rounded p-2 w-full ${errors.selectedItem ? "border-red-500" : ""}`}
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  <option value="">Select {itemType}</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                {errors.selectedItem && <p className="text-red-500 text-xs">{errors.selectedItem}</p>}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant={action === "add" ? "default" : "destructive"}>
                {action === "add" ? "Add" : "Remove"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}