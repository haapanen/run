import { useId, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  formatDistance,
  formatRaceTime,
  predictForDistance,
  predictForTime,
  raceDistances,
} from "../lib/race-predictor";

export const Route = createFileRoute("/prediction")({
  component: Prediction,
});

function Prediction() {
  const [previousDistance, setPreviousDistance] = useState("5");
  const [previousTime, setPreviousTime] = useState({
    hours: "0",
    minutes: "25",
    seconds: "0",
  });
  const [targetType, setTargetType] = useState<"distance" | "time">(
    "distance",
  );
  const [targetDistance, setTargetDistance] = useState("10");
  const [targetTime, setTargetTime] = useState({
    hours: "1",
    minutes: "0",
    seconds: "0",
  });

  const previousSeconds = timeToSeconds(previousTime);
  const targetSeconds = timeToSeconds(targetTime);
  const prediction =
    targetType === "distance"
      ? predictForDistance(
          previousSeconds,
          Number(previousDistance),
          Number(targetDistance),
        )
      : predictForTime(
          previousSeconds,
          Number(previousDistance),
          targetSeconds,
        );
  const hasResults = prediction.models.length > 0;

  return (
    <main className="prediction-page">
      <header className="prediction-header">
        <p className="prediction-kicker">Race equivalency</p>
        <h1>Race predictor</h1>
        <p>Compare five established ways to project your next race.</p>
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
          />
          <TimeField
            legend="Finish time"
            value={previousTime}
            onChange={setPreviousTime}
          />
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
                  ? formatRaceTime(prediction.averageSeconds)
                  : formatDistance(prediction.averageDistanceKm)}
              </strong>
            </div>
          )}
        </div>

        {hasResults ? (
          <div className="model-list">
            {prediction.models.map((model, index) => (
              <article className="model-result" key={model.shortName}>
                <span className="model-index">{String(index + 1).padStart(2, "0")}</span>
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
                      ? formatRaceTime(model.seconds)
                      : formatDistance(model.distanceKm)}
                  </strong>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-result">Enter valid race values to see predictions.</p>
        )}
      </section>
      <p className="prediction-note">
        Predictions are estimates, not guarantees. The single-race CS / D′ result
        uses a Riegel-calibrated second point; two maximal efforts are required
        for a measured fit.
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
}: {
  legend: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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
            aria-label={`${label}, exact kilometres`}
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <span>km</span>
        </label>
      </div>
    </div>
  );
}
