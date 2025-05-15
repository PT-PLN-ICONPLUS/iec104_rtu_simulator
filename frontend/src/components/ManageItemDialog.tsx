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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { Item } from "@/lib/items";

type ManageItemDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: "add" | "edit" | "remove";  // Added "edit"
  items?: Item[];
  itemToEdit?: any;  // Add this prop
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

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setIOALocalRemote(itemToEdit.ioa_local_remote?.toString() || "");
        setIsDoublePoint(itemToEdit.is_double_point ? "true" : "false");
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
    setIOALocalRemote("");
    setIsDoublePoint("false");
    setAddressDP("");
    setIoaCbStatusClose("");
    setControlDP("");
    setValTelesignal("");
    setUnit("");
    setValTelemetry("");
    setScaleFactor("1");
    setMinValue("");
    setMaxValue("");
    setErrors({});
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

      if (scaleFactor === "" || isNaN(Number(scaleFactor)) || Number(scaleFactor) <= 0) {
        newErrors.scaleFactor = "Valid scale factor is required (must be greater than 0)";
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

    const commonData = action === "edit" && itemToEdit ? { id: itemToEdit.id } : {};

    if (action === "add" || action === "edit") {
      if (itemType === "Circuit Breaker") {
        const isDP = isDoublePoint === "true";
        onSubmit({
          ...commonData,
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
      } else if (itemType === "Telesignal") {
        onSubmit({
          ...commonData,
          name,
          ioa: parseInt(address),
          interval: parseInt(interval),
          value: parseInt(valTelesignal),
        });
      } else if (itemType === "Telemetry") {
        onSubmit({
          ...commonData,
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
              <>
                <div className="flex w-full items-center gap-1.5">
                  <Label htmlFor="item-type" className="w-1/3">Item Type</Label>
                  <select
                    id="item-type"
                    className={`border rounded p-2 w-2/3 ${errors.itemType ? "border-red-500" : ""}`}
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                  >
                    <option value="">Choose</option>
                    <option value="Circuit Breaker">Circuit Breaker</option>
                    <option value="Telesignal">Telesignal</option>
                    <option value="Telemetry">Telemetry</option>
                  </select>
                  {errors.itemType && <p className="text-red-500 text-xs">{errors.itemType}</p>}
                </div>

                {itemType && (
                  <div className="flex w-full items-center gap-1.5">
                    <Label htmlFor="name" className="w-1/3">Name</Label>
                    <input
                      type="text"
                      id="name"
                      className={`border rounded p-2 w-2/3 ${errors.name ? "border-red-500" : ""}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                  </div>
                )}

                {itemType && (
                  <div className="flex w-full items-center gap-1.5">
                    <Label htmlFor="address" className="w-1/3">{itemType == "Circuit Breaker" ? "IOA CB Status Open" : "IOA"}</Label>
                    <input
                      type="number"
                      id="address"
                      className={`border rounded p-2 w-2/3 ${errors.address ? "border-red-500" : ""}`}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                  </div>
                )}

                {/* if item type not selected or cb then hide */}
                {itemType && itemType !== "Circuit Breaker" && (
                  <div className="flex w-full items-center gap-1.5">
                    <Label htmlFor="interval" className="w-1/3">Interval</Label>
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

                {itemType === "Circuit Breaker" && (
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
                        defaultValue="true"
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

                {itemType === "Telesignal" && (
                  <div className="flex w-full items-center gap-1.5">
                    <Label htmlFor="value-telesignal" className="w-1/3">Value</Label>
                    <RadioGroup
                      id="value-telesignal"
                      value={valTelesignal}
                      onValueChange={setValTelesignal}
                      defaultValue="0"
                    >
                      <div className="flex flex-row gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="telesignal-on" />
                          <Label htmlFor="telesignal-on">ON</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id="telesignal-off" />
                          <Label htmlFor="telesignal-off">OFF</Label>
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
            ) : action === "edit" ? (
              <>
                <div className="flex w-full items-center gap-1.5">
                  <Label htmlFor="name" className="w-1/3">Name</Label>
                  <input
                    type="text"
                    id="name"
                    className={`border rounded p-2 w-2/3 ${errors.name ? "border-red-500" : ""}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>

                {/* Same fields that appear in add form for the specific item type */}
                {itemType === "Circuit Breaker" && (
                  <>
                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="address" className="w-1/3">IOA CB Status Open</Label>
                      <input
                        type="number"
                        id="address"
                        className={`border rounded p-2 w-2/3 ${errors.address ? "border-red-500" : ""}`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                    </div>

                    {/* Circuit Breaker form fields... */}
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

                    {/* Other Circuit Breaker fields... */}
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
                  </>
                )}

                {itemType === "Telesignal" && (
                  <>
                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="address" className="w-1/3">IOA</Label>
                      <input
                        type="number"
                        id="address"
                        className={`border rounded p-2 w-2/3 ${errors.address ? "border-red-500" : ""}`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="interval" className="w-1/3">Interval</Label>
                      <input
                        type="number"
                        id="interval"
                        className={`border rounded p-2 w-2/3 ${errors.interval ? "border-red-500" : ""}`}
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                      />
                      {errors.interval && <p className="text-red-500 text-xs">{errors.interval}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="value_telesignal" className="w-1/3">Value</Label>
                      <RadioGroup
                        id="value_telesignal"
                        value={valTelesignal}
                        onValueChange={setValTelesignal}
                        defaultValue="0"
                      >
                        <div className="flex flex-row gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="edit-telesignal-on" />
                            <Label htmlFor="edit-telesignal-on">ON</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="0" id="edit-telesignal-off" />
                            <Label htmlFor="edit-telesignal-off">OFF</Label>
                          </div>
                        </div>
                      </RadioGroup>
                      {errors.valTelesignal && <p className="text-red-500 text-xs">{errors.valTelesignal}</p>}
                    </div>
                  </>
                )}

                {itemType === "Telemetry" && (
                  <>
                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="address" className="w-1/3">IOA</Label>
                      <input
                        type="number"
                        id="address"
                        className={`border rounded p-2 w-2/3 ${errors.address ? "border-red-500" : ""}`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                    </div>

                    <div className="flex w-full items-center gap-1.5">
                      <Label htmlFor="interval" className="w-1/3">Interval</Label>
                      <input
                        type="number"
                        id="interval"
                        className={`border rounded p-2 w-2/3 ${errors.interval ? "border-red-500" : ""}`}
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                      />
                      {errors.interval && <p className="text-red-500 text-xs">{errors.interval}</p>}
                    </div>

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
                        className={`border rounded p-2 w-2/3 ${errors.valTelemetry ? "border-red-500" : ""}`}
                        value={valTelemetry}
                        onChange={(e) => setValTelemetry(e.target.value)}
                        step="any"
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