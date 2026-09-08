import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DistanceField,
  TimeField,
} from "../components/prediction-fields";
import {
  adjustRelativeVo2MaxForWeight,
  calculateCooperDistanceKm,
  calculateCooperVo2Max,
  formatVo2Max,
} from "../lib/cooper-calculator";
import { timeToSeconds, type TimeValue } from "../lib/duration";
import {
  formatDistance,
  predictForTime,
  type DistanceUnit,
} from "../lib/race-predictor";

export const Route = createFileRoute("/prediction_/cooper")({
  component: CooperPrediction,
});

const COOPER_SECONDS = 12 * 60;

function CooperPrediction() {
  const [unit, setUnit] = useState<DistanceUnit>("km");
  const [previousDistance, setPreviousDistance] = useState("5");
  const [previousTime, setPreviousTime] = useState<TimeValue>({
    hours: "0",
    minutes: "25",
    seconds: "0",
  });
  const [useCriticalSpeed, setUseCriticalSpeed] = useState(false);
  const [secondDistance, setSecondDistance] = useState("");
  const [secondTime, setSecondTime] = useState<TimeValue>({
    hours: "",
    minutes: "",
    seconds: "",
  });
  const [useWeightEstimate, setUseWeightEstimate] = useState(false);
  const [currentWeight, setCurrentWeight] = useState("70");
  const [newWeight, setNewWeight] = useState("75");

  const currentWeightKg = Number(currentWeight);
  const newWeightKg = Number(newWeight);
  const prediction = predictForTime(
    timeToSeconds(previousTime),
    Number(previousDistance),
    COOPER_SECONDS,
    useCriticalSpeed
      ? {
          seconds: timeToSeconds(secondTime),
          distanceKm: Number(secondDistance),
        }
      : undefined,
  );
  const averageVo2Max = calculateCooperVo2Max(
    prediction.averageDistanceKm,
    unit,
  );
  const adjustedAverageVo2Max = adjustRelativeVo2MaxForWeight(
    averageVo2Max,
    currentWeightKg,
    newWeightKg,
  );
  const criticalSpeedModel = prediction.models.find(
    (model) => model.shortName === "CS / D′",
  );
  const displayedModels = useCriticalSpeed
    ? prediction.models
    : prediction.models.filter((model) => model.shortName !== "CS / D′");
  const adjustedAverageDistanceKm = calculateCooperDistanceKm(
    adjustedAverageVo2Max,
  );
  const hasResults = prediction.models.length > 0;
  const hasWeightEstimate =
    useWeightEstimate && currentWeightKg > 0 && newWeightKg > 0;

  return (
    <main className="prediction-page">
      <header className="prediction-header">
        <div>
          <p className="prediction-kicker">12-minute effort</p>
          <h1>Cooper test prediction</h1>
          <p>Estimate distance and relative VO₂ max from a previous race.</p>
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

      <section className="prediction-inputs" aria-label="Cooper test inputs">
        <div className="input-group">
          <div className="input-group-heading">
            <span className="step-number">01</span>
            <h2>Previous race</h2>
          </div>
          <DistanceField
            id="cooper-previous-distance"
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
                id="cooper-second-distance"
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
              {criticalSpeedModel?.unavailableReason && (
                <p className="model-unavailable" role="status">
                  {criticalSpeedModel.unavailableReason}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="input-group">
          <div className="input-group-heading">
            <span className="step-number">02</span>
            <h2>Weight effect</h2>
          </div>
          <label className="critical-speed-toggle">
            <input
              type="checkbox"
              checked={useWeightEstimate}
              onChange={(event) => setUseWeightEstimate(event.target.checked)}
            />
            <span>Estimate weight effect</span>
          </label>
          {useWeightEstimate && (
            <>
              <div className="cooper-weight-fields">
                <WeightField
                  id="current-weight"
                  label="Current weight"
                  value={currentWeight}
                  onChange={setCurrentWeight}
                />
                <WeightField
                  id="new-weight"
                  label="New weight"
                  value={newWeight}
                  onChange={setNewWeight}
                />
              </div>
              <p className="weight-assumption">
                Assumes absolute oxygen uptake stays constant. Relative VO₂ max
                changes in inverse proportion to body mass.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="prediction-results" aria-live="polite">
        <div className="results-heading">
          <div>
            <p className="prediction-kicker">Model comparison</p>
            <h2>Estimated Cooper result</h2>
          </div>
          {hasResults && prediction.averageDistanceKm && (
            <div className="average-result">
              <span>
                {hasWeightEstimate
                  ? "Average distance at new weight"
                  : "Average distance"}
              </span>
              <strong>
                {formatDistance(
                  hasWeightEstimate
                    ? adjustedAverageDistanceKm
                    : prediction.averageDistanceKm,
                  unit,
                )}
              </strong>
              <span className="average-result-secondary">
                {hasWeightEstimate &&
                  adjustedAverageVo2Max !== undefined &&
                  adjustedAverageDistanceKm !== undefined && (
                    <>
                      Current: {formatDistance(prediction.averageDistanceKm, unit)} ·{" "}
                      {formatVo2Max(averageVo2Max)} · New weight: {formatVo2Max(adjustedAverageVo2Max)}
                    </>
                  )}
                {!hasWeightEstimate && <>VO₂ max: {formatVo2Max(averageVo2Max)}</>}
              </span>
            </div>
          )}
        </div>

        {hasResults ? (
          <div className="model-list">
            {displayedModels.map((model, index) => {
              const vo2Max = calculateCooperVo2Max(model.distanceKm, unit);
              const adjustedVo2Max = adjustRelativeVo2MaxForWeight(
                vo2Max,
                currentWeightKg,
                newWeightKg,
              );
              const adjustedDistanceKm = calculateCooperDistanceKm(
                adjustedVo2Max,
              );
              const change =
                vo2Max !== undefined && adjustedVo2Max !== undefined
                  ? adjustedVo2Max - vo2Max
                  : undefined;

              return (
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
                    <div className="cooper-model-values">
                      <strong>
                        {formatDistance(
                          hasWeightEstimate
                            ? adjustedDistanceKm
                            : model.distanceKm,
                          unit,
                        )}
                      </strong>
                      <span>
                        Current: {hasWeightEstimate && (
                          <>{formatDistance(model.distanceKm, unit)} · </>
                        )}
                        {formatVo2Max(vo2Max)}
                      </span>
                      {hasWeightEstimate && (
                        <>
                          <span>
                            New weight: {formatDistance(adjustedDistanceKm, unit)} ·{" "}
                            {formatVo2Max(adjustedVo2Max)}
                          </span>
                          <span className="cooper-change">
                            {formatVo2Change(change)}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-result">
            Enter valid race values to see predictions.
          </p>
        )}
      </section>
      <p className="prediction-note">
        VO₂ max uses the Cooper 12-minute distance formula. Predictions are
        estimates, not guarantees.
      </p>
    </main>
  );
}

function WeightField({
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
  return (
    <label className="cooper-weight-field" htmlFor={id}>
      {label}
      <span className="cooper-weight-input">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="1"
          step="0.1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span>kg</span>
      </span>
    </label>
  );
}

function formatVo2Change(change: number | undefined) {
  if (change === undefined) return "—";
  if (change === 0) return "No change";

  return `${change < 0 ? "Lower" : "Higher"} by ${Math.abs(change).toFixed(1)} mL/(kg·min)`;
}
