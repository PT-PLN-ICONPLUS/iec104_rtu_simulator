import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

// Define the types for the props the component will receive
type AddDialogProps = {
  errors: Record<string, string>;
  itemType: string;
  setItemType: (value: string) => void;
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
  value: string;
  setValue: (value: string) => void;
  valueHighLimit: string;
  setValueHighLimit: (value: string) => void;
  valueLowLimit: string;
  setValueLowLimit: (value: string) => void;
  ioaHighLimit: string;
  setIOAHighLimit: (value: string) => void;
  ioaLowLimit: string;
  setIOALowLimit: (value: string) => void;
  ioaStatusRaiseLower: string;
  setIOAStatusRaiseLower: (value: string) => void;
  ioaCommandRaiseLower: string;
  setIOACommandRaiseLower: (value: string) => void;
  ioaStatusAutoManual: string;
  setIOAStatusAutoManual: (value: string) => void;
  ioaCommandAutoManual: string;
  setIOACommandAutoManual: (value: string) => void;
  ioaLocalRemote: string;
  setIOALocalRemote: (value: string) => void;
};

export function AddDialog({
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
  setIOALocalRemote

}: AddDialogProps) {
  return (
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
          <option value="Tap Changer">Tap Changer</option>
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
          <Label htmlFor="address" className="w-1/3">{itemType === "Circuit Breaker" ? "IOA CB Status Open" : "IOA"}</Label>
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
            <Label className="w-1/3">Local Remote DP</Label>
            <RadioGroup
              value={isLocalRemoteDP}
              onValueChange={setIsLocalRemoteDP}
              defaultValue="false"
            >
              <div className="flex flex-row gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="lr-dp-yes" />
                  <Label htmlFor="lr-dp-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="lr-dp-no" />
                  <Label htmlFor="lr-dp-no">No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {isLocalRemoteDP === "true" && (
            <div className="flex w-full items-center gap-1.5">
              <Label htmlFor="ioaLocalRemoteDP" className="w-1/3">
                IOA Local/Remote DP
              </Label>
              <input
                type="number"
                id="ioaLocalRemoteDP"
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

      {itemType === "Tap Changer" && (
        <>
          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="value" className="w-1/3">Value</Label>
            <input
              type="number"
              id="value"
              className={`border rounded p-2 w-2/3 ${errors.value ? "border-red-500" : ""}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {errors.value && <p className="text-red-500 text-xs">{errors.value}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="value-high-limit" className="w-1/3">Value High Limit</Label>
            <input
              type="number"
              id="value-high-limit"
              className={`border rounded p-2 w-2/3 ${errors.valueHighLimit ? "border-red-500" : ""}`}
              value={valueHighLimit}
              onChange={(e) => setValueHighLimit(e.target.value)}
            />
            {errors.valueHighLimit && <p className="text-red-500 text-xs">{errors.valueHighLimit}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="value-low-limit" className="w-1/3">Value Low Limit</Label>
            <input
              type="number"
              id="value-low-limit"
              className={`border rounded p-2 w-2/3 ${errors.valueLowLimit ? "border-red-500" : ""}`}
              value={valueLowLimit}
              onChange={(e) => setValueLowLimit(e.target.value)}
            />
            {errors.valueLowLimit && <p className="text-red-500 text-xs">{errors.valueLowLimit}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-high-limit" className="w-1/3">IOA High Limit</Label>
            <input
              type="number"
              id="ioa-high-limit"
              className={`border rounded p-2 w-2/3 ${errors.ioaHighLimit ? "border-red-500" : ""}`}
              value={ioaHighLimit}
              onChange={(e) => setIOAHighLimit(e.target.value)}
            />
            {errors.ioaHighLimit && <p className="text-red-500 text-xs">{errors.ioaHighLimit}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-low-limit" className="w-1/3">IOA Low Limit</Label>
            <input
              type="number"
              id="ioa-low-limit"
              className={`border rounded p-2 w-2/3 ${errors.ioaLowLimit ? "border-red-500" : ""}`}
              value={ioaLowLimit}
              onChange={(e) => setIOALowLimit(e.target.value)}
            />
            {errors.ioaLowLimit && <p className="text-red-500 text-xs">{errors.ioaLowLimit}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-status-raise-lower" className="w-1/3">IOA Status Raise/Lower</Label>
            <input
              type="number"
              id="ioa-status-raise-lower"
              className={`border rounded p-2 w-2/3 ${errors.ioaStatusRaiseLower ? "border-red-500" : ""}`}
              value={ioaStatusRaiseLower}
              onChange={(e) => setIOAStatusRaiseLower(e.target.value)}
            />
            {errors.ioaStatusRaiseLower && <p className="text-red-500 text-xs">{errors.ioaStatusRaiseLower}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-command-raise-lower" className="w-1/3">IOA Command Raise/Lower</Label>
            <input
              type="number"
              id="ioa-command-raise-lower"
              className={`border rounded p-2 w-2/3 ${errors.ioaCommandRaiseLower ? "border-red-500" : ""}`}
              value={ioaCommandRaiseLower}
              onChange={(e) => setIOACommandRaiseLower(e.target.value)}
            />
            {errors.ioaCommandRaiseLower && <p className="text-red-500 text-xs">{errors.ioaCommandRaiseLower}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-status-auto-manual" className="w-1/3">IOA Status Auto/Manual</Label>
            <input
              type="number"
              id="ioa-status-auto-manual"
              className={`border rounded p-2 w-2/3 ${errors.ioaStatusAutoManual ? "border-red-500" : ""}`}
              value={ioaStatusAutoManual}
              onChange={(e) => setIOAStatusAutoManual(e.target.value)}
            />
            {errors.ioaStatusAutoManual && <p className="text-red-500 text-xs">{errors.ioaStatusAutoManual}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-command-auto-manual" className="w-1/3">IOA Command Auto/Manual</Label>
            <input
              type="number"
              id="ioa-command-auto-manual"
              className={`border rounded p-2 w-2/3 ${errors.ioaCommandAutoManual ? "border-red-500" : ""}`}
              value={ioaCommandAutoManual}
              onChange={(e) => setIOACommandAutoManual(e.target.value)}
            />
            {errors.ioaCommandAutoManual && <p className="text-red-500 text-xs">{errors.ioaCommandAutoManual}</p>}
          </div>

          <div className="flex w-full items-center gap-1.5">
            <Label htmlFor="ioa-local-remote" className="w-1/3">IOA Local/Remote</Label>
            <input
              type="number"
              id="ioa-local-remote"
              className={`border rounded p-2 w-2/3 ${errors.ioaLocalRemote ? "border-red-500" : ""}`}
              value={ioaLocalRemote}
              onChange={(e) => setIOALocalRemote(e.target.value)}
            />
            {errors.ioaLocalRemote && <p className="text-red-500 text-xs">{errors.ioaLocalRemote}</p>}
          </div>
        </>
      )}
    </>
  )
}