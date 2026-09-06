import { useId, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  formatDistance,
  formatPace,
  formatRaceTime,
  predictForDistance,
  predictForTime,
  raceDistances,
  type DistanceUnit,
} from "../lib/race-predictor";

export const Route = createFileRoute("/prediction")({
  component: Prediction,
});

function Prediction() {
  const [unit, setUnit] = useState<DistanceUnit>("km");
  const [previousDistance, setPreviousDistance] = useState("5");
  const [previousTime, setPreviousTime] = useState({
    hours: "0",
    minutes: "25",
    seconds: "0",
  });
  const [useCriticalSpeed, setUseCriticalSpeed] = useState(false);
  const [secondDistance, setSecondDistance] = useState("");
  const [secondTime, setSecondTime] = useState({
    hours: "",
    minutes: "",
    seconds: "",
  });
  const [targetType, setTargetType] = useState<"distance" | "time">("distance");
  const [targetDistance, setTargetDistance] = useState("10");
  const [targetTime, setTargetTime] = useState({
    hours: "1",
    minutes: "0",
    seconds: "0",
  });

  const previousSeconds = timeToSeconds(previousTime);
  const targetSeconds = timeToSeconds(targetTime);
  const criticalSpeedEffort = useCriticalSpeed
    ? {
        seconds: timeToSeconds(secondTime),
        distanceKm: Number(secondDistance),
      }
    : undefined;
  const prediction =
    targetType === "distance"
      ? predictForDistance(
          previousSeconds,
          Number(previousDistance),
          Number(targetDistance),
          criticalSpeedEffort,
        )
      : predictForTime(
          previousSeconds,
          Number(previousDistance),
          targetSeconds,
          criticalSpeedEffort,
        );
  const hasResults = prediction.models.length > 0;

  return (
    <main className="prediction-page">
      <header className="prediction-header">
        <div>
          <p className="prediction-kicker">Race equivalency</p>
          <h1>Race predictor</h1>
          <p>Compare five established ways to project your next race.</p>
        </div>
        <div className="pace-unit-group" aria-label="Distance unit">
          <button
            type="button"
            aria-pressed={unit === "km"}
            onClick={() => setUnit("km")}
          >
            km
          </button>
          <button
            type="button"
            aria-pressed={unit === "mi"}
            onClick={() => setUnit("mi")}
          >
            miles
          </button>
        </div>
      </header>

      <section className="prediction-inputs" aria-label="Prediction inputs">
        <div className="input-group">
          <div className="input-group-heading">
            <span className="step-number">01</span>
            <h2>Previous race</h2>
          </div>
          <DistanceField
            id="previous-distance"
            label="Distance"
            value={previousDistance}
            onChange={setPreviousDistance}
            unit={unit}
          />
          <TimeField
            legend="Finish time"
            value={previousTime}
            onChange={setPreviousTime}
          />
          <label className="critical-speed-toggle">
            <input
              type="checkbox"
              checked={useCriticalSpeed}
              onChange={(event) => setUseCriticalSpeed(event.target.checked)}
            />
            <span>Use Critical Speed &amp; D′</span>
          </label>
          {useCriticalSpeed && (
            <div className="critical-speed-inputs">
              <h3>Second maximal effort</h3>
              <DistanceField
                id="second-distance"
                label="Distance"
                value={secondDistance}
                onChange={setSecondDistance}
                unit={unit}
                required
              />
              <TimeField
                legend="Finish time"
                value={secondTime}
                onChange={setSecondTime}
                required
              />
            </div>
          )}
        </div>

        <div className="input-group">
          <div className="input-group-heading">
            <span className="step-number">02</span>
            <h2>Target</h2>
          </div>
          <div className="target-switch" aria-label="Target type">
            <button
              type="button"
              aria-pressed={targetType === "distance"}
              onClick={() => setTargetType("distance")}
            >
              Distance
            </button>
            <button
              type="button"
              aria-pressed={targetType === "time"}
              onClick={() => setTargetType("time")}
            >
              Time
            </button>
          </div>
          {targetType === "distance" ? (
            <DistanceField
              id="target-distance"
              label="Target distance"
              value={targetDistance}
              onChange={setTargetDistance}
              unit={unit}
            />
          ) : (
            <TimeField
              legend="Target time"
              value={targetTime}
              onChange={setTargetTime}
            />
          )}
        </div>
      </section>

      <section className="prediction-results" aria-live="polite">
        <div className="results-heading">
          <div>
            <p className="prediction-kicker">Model comparison</p>
            <h2>Estimated {targetType === "distance" ? "time" : "distance"}</h2>
          </div>
          {hasResults && (
            <div className="average-result">
              <span>Average</span>
              <strong>
                {targetType === "distance"
                  ? `${formatRaceTime(prediction.averageSeconds)} (${formatPace(
                      prediction.averageSeconds,
                      Number(targetDistance),
                      unit,
                    )})`
                  : `${formatDistance(prediction.averageDistanceKm, unit)} (${formatPace(
                      targetSeconds,
                      prediction.averageDistanceKm,
                      unit,
                    )})`}
              </strong>
            </div>
          )}
        </div>

        {hasResults ? (
          <div className="model-list">
            {prediction.models.map((model, index) => (
              <article className="model-result" key={model.shortName}>
                <span className="model-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="model-copy">
                  <h3>{model.name}</h3>
                  <p>{model.description}</p>
                </div>
                {model.unavailableReason ? (
                  <span className="model-unavailable">
                    {model.unavailableReason}
                  </span>
                ) : (
                  <strong className="model-value">
                    {targetType === "distance"
                      ? `${formatRaceTime(model.seconds)} (${formatPace(
                          model.seconds,
                          Number(targetDistance),
                          unit,
                        )})`
                      : `${formatDistance(model.distanceKm, unit)} (${formatPace(
                          targetSeconds,
                          model.distanceKm,
                          unit,
                        )})`}
                  </strong>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-result">
            Enter valid race values to see predictions.
          </p>
        )}
      </section>
      <p className="prediction-note">
        Predictions are estimates, not guarantees. Critical Speed &amp; D′
        requires two maximal efforts.
      </p>
    </main>
  );
}

type TimeValue = { hours: string; minutes: string; seconds: string };

function timeToSeconds(value: TimeValue) {
  return (
    Number(value.hours) * 3600 +
    Number(value.minutes) * 60 +
    Number(value.seconds)
  );
}

function TimeField({
  legend,
  value,
  onChange,
  required = false,
}: {
  legend: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  required?: boolean;
}) {
  const id = useId();
  const fields = [
    { key: "hours", label: "hr", max: undefined },
    { key: "minutes", label: "min", max: 59 },
    { key: "seconds", label: "sec", max: 59 },
  ] as const;

  return (
    <fieldset className="time-field">
      <legend>{legend}</legend>
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

function DistanceField({
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

const KM_PER_MILE = 1.609344;

function distanceFromKm(value: string, unit: DistanceUnit) {
  if (value === "" || unit === "km") return value;
  return (Number(value) / KM_PER_MILE).toFixed(3).replace(/\.?0+$/, "");
}

function distanceToKm(value: string, unit: DistanceUnit) {
  if (value === "" || unit === "km") return value;
  return (Number(value) * KM_PER_MILE).toString();
}
