import { useId } from "react";
import { timeToSeconds, type TimeValue } from "../lib/duration";
import { raceDistances, type DistanceUnit } from "../lib/race-predictor";

const KM_PER_MILE = 1.609344;

function secondsToTimeValue(totalSeconds: number): TimeValue {
  return {
    hours: Math.floor(totalSeconds / 3600).toString(),
    minutes: Math.floor((totalSeconds % 3600) / 60).toString(),
    seconds: (totalSeconds % 60).toString(),
  };
}

export function TimeField({
  legend,
  value,
  onChange,
  required = false,
  presets,
}: {
  legend: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  required?: boolean;
  presets?: ReadonlyArray<{ label: string; seconds: number }>;
}) {
  const id = useId();
  const selectedPreset = presets?.some(
    (preset) => preset.seconds === timeToSeconds(value),
  )
    ? timeToSeconds(value).toString()
    : "custom";
  const fields = [
    { key: "hours", label: "hr", max: undefined },
    { key: "minutes", label: "min", max: 59 },
    { key: "seconds", label: "sec", max: 59 },
  ] as const;

  return (
    <fieldset className="time-field">
      <legend>{legend}</legend>
      {presets && (
        <select
          className="time-preset"
          aria-label={`${legend} preset`}
          value={selectedPreset}
          onChange={(event) => {
            if (event.target.value !== "custom") {
              onChange(secondsToTimeValue(Number(event.target.value)));
            }
          }}
        >
          {presets.map((preset) => (
            <option key={preset.seconds} value={preset.seconds}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      )}
      <div className="time-inputs">
        {fields.map((field) => (
          <label key={field.key} htmlFor={`${id}-${field.key}`}>
            <input
              id={`${id}-${field.key}`}
              type="number"
              inputMode="numeric"
              min="0"
              max={field.max}
              required={required}
              value={value[field.key]}
              onChange={(event) =>
                onChange({ ...value, [field.key]: event.target.value })
              }
            />
            <span>{field.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DistanceField({
  id,
  label,
  value,
  onChange,
  unit,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit: DistanceUnit;
  required?: boolean;
}) {
  const isPreset = raceDistances.some(
    (distance) => distance.km.toString() === value,
  );

  return (
    <div className="distance-field">
      <label htmlFor={`${id}-preset`}>{label}</label>
      <div className="distance-controls">
        <select
          id={`${id}-preset`}
          value={isPreset ? value : "custom"}
          onChange={(event) => {
            if (event.target.value !== "custom") onChange(event.target.value);
          }}
        >
          {raceDistances.map((distance) => (
            <option key={distance.label} value={distance.km}>
              {distance.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <label className="exact-distance" htmlFor={`${id}-exact`}>
          <input
            id={`${id}-exact`}
            type="number"
            aria-label={`${label}, exact ${unit === "km" ? "kilometres" : "miles"}`}
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required={required}
            value={distanceFromKm(value, unit)}
            onChange={(event) => onChange(distanceToKm(event.target.value, unit))}
          />
          <span>{unit}</span>
        </label>
      </div>
    </div>
  );
}

function distanceFromKm(value: string, unit: DistanceUnit) {
  if (value === "" || unit === "km") return value;
  return (Number(value) / KM_PER_MILE).toFixed(3).replace(/\.?0+$/, "");
}

function distanceToKm(value: string, unit: DistanceUnit) {
  if (value === "" || unit === "km") return value;
  return (Number(value) * KM_PER_MILE).toString();
}