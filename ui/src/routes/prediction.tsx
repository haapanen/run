import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DistanceField,
  TimeField,
} from "../components/prediction-fields";
import { timeToSeconds } from "../lib/duration";
import {
  formatDistance,
  formatPace,
  formatRaceTime,
  predictForDistance,
  predictForTime,
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
              presets={targetTimePresets}
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

const targetTimePresets = [
  { label: "Cooper test (12 min)", seconds: 12 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "60 min", seconds: 60 * 60 },
] as const;

