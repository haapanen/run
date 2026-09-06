const KM_PER_MILE = 1.609344;

const paceUnits = {
  "min/km": { distance: "km", kmPerUnit: 1 },
  "min/mile": { distance: "mi", kmPerUnit: KM_PER_MILE },
} as const;

const distances = [
  { name: "Mile", km: 1.60934 },
  { name: "5K", km: 5 },
  { name: "10K", km: 10 },
  { name: "Half marathon", km: 21.0975 },
  { name: "Marathon", km: 42.195 },
] as const;

export type PaceUnit = keyof typeof paceUnits;

function parsePace(value: string) {
  const match = value.trim().match(/^(\d+):([0-5]\d)$/);
  if (!match) return 0;

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

function formatElapsedTime(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "--:--";

  const totalSeconds = Math.round(hours * 60 * 60);
  const hoursPart = Math.floor(totalSeconds / 3600);
  const minutesPart = Math.floor((totalSeconds % 3600) / 60);
  const secondsPart = totalSeconds % 60;
  const minutes = minutesPart.toString().padStart(2, "0");
  const seconds = secondsPart.toString().padStart(2, "0");

  return hoursPart > 0
    ? `${hoursPart}:${minutes}:${seconds}`
    : `${minutesPart}:${seconds}`;
}

function createPaceRow(paceSeconds: number, unit: PaceUnit) {
  const unitDefinition = paceUnits[unit];

  return {
    pace: formatElapsedTime(paceSeconds / 3600),
    projections: distances.map((distance) => ({
      name: distance.name,
      finishTime: formatElapsedTime(
        (paceSeconds * distance.km) /
          unitDefinition.kmPerUnit /
          3600,
      ),
    })),
  };
}

export function convertPace(
  value: string,
  fromUnit: PaceUnit,
  toUnit: PaceUnit,
) {
  const paceSeconds = parsePace(value);
  if (paceSeconds === 0 || fromUnit === toUnit) return value;

  const convertedSeconds =
    (paceSeconds * paceUnits[toUnit].kmPerUnit) /
    paceUnits[fromUnit].kmPerUnit;
  return formatElapsedTime(convertedSeconds / 3600);
}

export function calculatePaceChart(value: string, unit: PaceUnit) {
  const paceSeconds = parsePace(value);
  const unitDefinition = paceUnits[unit];
  const rows = Array.from({ length: 19 }, (_, index) =>
    createPaceRow((180 + index * 30) * unitDefinition.kmPerUnit, unit),
  );

  return {
    unit,
    distanceUnit: unitDefinition.distance,
    customRow: createPaceRow(paceSeconds, unit),
    rows,
    rangeLabel: `${rows[0].pace}–${rows.at(-1)?.pace} min/${unitDefinition.distance}`,
  };
}