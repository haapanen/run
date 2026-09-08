import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  calculatePaceChart,
  convertPace,
  type PaceUnit,
} from "../lib/pace-calculator";

export const Route = createFileRoute("/paces")({
  component: Paces,
});

function Paces() {
  const [unit, setUnit] = useState<PaceUnit>("min/km");
  const [pace, setPace] = useState("6:00");
  const chart = calculatePaceChart(pace, unit);

  const changeUnit = (nextUnit: PaceUnit) => {
    setPace(convertPace(pace, unit, nextUnit));
    setUnit(nextUnit);
  };

  return (
    <main className="pace-page">
      <section className="chart-section">
        <div className="section-heading">
          <div>
            <h1>Pace chart</h1>
            <p className="updated-note">{chart.rangeLabel}</p>
          </div>
          <div className="pace-unit-group" aria-label="Pace unit">
            <button
              type="button"
              aria-pressed={unit === "min/km"}
              onClick={() => changeUnit("min/km")}
            >
              min/km
            </button>
            <button
              type="button"
              aria-pressed={unit === "min/mile"}
              onClick={() => changeUnit("min/mile")}
            >
              min/mile
            </button>
          </div>
        </div>
        <div className="table-shell">
          <table aria-label="Race day projections">
            <thead>
              <tr>
                <th>Pace</th>
                {chart.customRow.projections.map((projection) => (
                  <th key={projection.name}>{projection.name}</th>
                ))}
                <th>Cooper distance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="custom-row">
                <td className="pace-value">
                  <label className="custom-label" htmlFor="pace">
                    Custom
                  </label>
                  <div className="custom-pace-fields">
                    <input
                      id="pace"
                      type="text"
                      pattern="[0-9]+:[0-5][0-9]"
                      aria-label={`Custom pace in ${unit}`}
                      value={pace}
                      onChange={(event) => setPace(event.target.value)}
                    />
                    <span>{unit}</span>
                  </div>
                </td>
                {chart.customRow.projections.map((projection) => (
                  <td key={`custom-${projection.name}`}>
                    {projection.finishTime}
                  </td>
                ))}
                <td>{chart.customRow.cooperDistance}</td>
              </tr>
              {chart.rows.map((row) => (
                <tr key={row.pace}>
                  <td className="pace-value">
                    <strong>{row.pace}</strong>{" "}
                    <small>/{chart.distanceUnit}</small>
                  </td>
                  {row.projections.map((projection) => (
                    <td key={`${row.pace}-${projection.name}`}>
                      {projection.finishTime}
                    </td>
                  ))}
                  <td>{row.cooperDistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
