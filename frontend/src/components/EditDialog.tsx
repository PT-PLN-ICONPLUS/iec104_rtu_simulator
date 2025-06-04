import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

// Define the types for the props the component will receive
type EditDialogProps = {
  errors: Record<string, string>;
  itemType: string;
  name: string;
  setName: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  interval: string;
  setInterval: (value: string) => void;
  ioaCbStatusClose: string;
  setIoaCbStatusClose: (value: string) => void;
  ioaControlOpen: string;
  setIOAControlOpen: (value: string) => void;
  ioaControlClose: string;
  setIOAControlClose: (value: string) => void;
  isDoublePoint: string;
  setIsDoublePoint: (value: string) => void;
  addressDP: string;
  setAddressDP: (value: string) => void;
  controlDP: string;
  setControlDP: (value: string) => void;
  ioaLocalRemoteSP: string;
  setIOALocalRemoteSP: (value: string) => void;
  isLocalRemoteDP: string;
  setIsLocalRemoteDP: (value: string) => void;
  ioaLocalRemoteDP: string;
  setIOALocalRemoteDP: (value: string) => void;
  valTelesignal: string;
  setValTelesignal: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;
  valTelemetry: string;
  setValTelemetry: (value: string) => void;
  minValue: string;
  setMinValue: (value: string) => void;
  maxValue: string;
  setMaxValue: (value: string) => void;
  scaleFactor: string;
  setScaleFactor: (value: string) => void;
};

export function EditDialog({
  errors,
  itemType,
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
}: EditDialogProps) {
  return (
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
            <Label htmlFor="ioaLocalRemoteSP" className="w-1/3">
              IOA Local/Remote SP
            </Label>
            <input
              type="number"
              id="ioaLocalRemoteSP"
              className={`border rounded p-2 w-2/3 ${errors.ioaLocalRemoteSP ? "border-red-500" : ""}`}
              value={ioaLocalRemoteSP}
              onChange={(e) => setIOALocalRemoteSP(e.target.value)}
            />
            {errors.ioaLocalRemoteSP && <p className="text-red-500 text-xs">{errors.ioaLocalRemoteSP}</p>}
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
                  <RadioGroupItem value="true" id="dp-yes-edit" />
                  <Label htmlFor="dp-yes-edit">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="dp-no-edit" />
                  <Label htmlFor="dp-no-edit">No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {isDoublePoint === "true" && (
            <>
              <div className="flex w-full items-center gap-1.5">
                <Label htmlFor="address-dp-edit" className="w-1/3">IOA CB Status Double Point</Label>
                <input
                  type="number"
                  id="address-dp-edit"
                  className={`border rounded p-2 w-2/3 ${errors.addressDP ? "border-red-500" : ""}`}
                  value={addressDP}
                  onChange={(e) => setAddressDP(e.target.value)}
                />
                {errors.addressDP && <p className="text-red-500 text-xs">{errors.addressDP}</p>}
              </div>
              <div className="flex w-full items-center gap-1.5">
                <Label htmlFor="control-dp-edit" className="w-1/3">IOA Control Double Point</Label>
                <input
                  type="number"
                  id="control-dp-edit"
                  className={`border rounded p-2 w-2/3 ${errors.controlDP ? "border-red-500" : ""}`}
                  value={controlDP}
                  onChange={(e) => setControlDP(e.target.value)}
                />
                {errors.controlDP && <p className="text-red-500 text-xs">{errors.controlDP}</p>}
              </div>
            </>
          )}

          <div className="flex w-full items-center gap-1.5">
            <Label className="w-1/3">Local/Remote DP</Label>
            <RadioGroup
              value={isLocalRemoteDP}
              onValueChange={setIsLocalRemoteDP}
              defaultValue="false"
            >
              <div className="flex flex-row gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="lr-dp-yes-edit" />
                  <Label htmlFor="lr-dp-yes-edit">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="lr-dp-no-edit" />
                  <Label htmlFor="lr-dp-no-edit">No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {isLocalRemoteDP === "true" && (
            <div className="flex w-full items-center gap-1.5">
              <Label htmlFor="ioaLocalRemoteDP-edit" className="w-1/3">
                IOA Local/Remote DP
              </Label>
              <input
                type="number"
                id="ioaLocalRemoteDP-edit"
                className={`border rounded p-2 w-2/3 ${errors.ioaLocalRemoteDP ? "border-red-500" : ""}`}
                value={ioaLocalRemoteDP}
                onChange={(e) => setIOALocalRemoteDP(e.target.value)}
              />
              {errors.ioaLocalRemoteDP && <p className="text-red-500 text-xs">{errors.ioaLocalRemoteDP}</p>}
            </div>
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
  )
}