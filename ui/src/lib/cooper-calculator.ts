import type { DistanceUnit } from "./race-predictor";

const METERS_PER_KILOMETRE = 1000;
const KILOMETRES_PER_MILE = 1.609344;

export function calculateCooperVo2Max(
  distanceKm: number | undefined,
  unit: DistanceUnit,
) {
  if (distanceKm === undefined || distanceKm <= 0) return undefined;

  return unit === "km"
    ? (distanceKm * METERS_PER_KILOMETRE - 504.9) / 44.73
    : (35.97 * distanceKm) / KILOMETRES_PER_MILE - 11.29;
}

export function adjustRelativeVo2MaxForWeight(
  vo2Max: number | undefined,
  currentWeightKg: number,
  newWeightKg: number,
) {
  if (
    vo2Max === undefined ||
    vo2Max <= 0 ||
    currentWeightKg <= 0 ||
    newWeightKg <= 0
  ) {
    return undefined;
  }

  return vo2Max * (currentWeightKg / newWeightKg);
}

export function calculateCooperDistanceKm(vo2Max: number | undefined) {
  if (vo2Max === undefined || vo2Max <= 0) return undefined;

  return (vo2Max * 44.73 + 504.9) / METERS_PER_KILOMETRE;
}

export function formatVo2Max(vo2Max: number | undefined) {
  return vo2Max === undefined || !Number.isFinite(vo2Max)
    ? "—"
    : `${vo2Max.toFixed(1)} mL/(kg·min)`;
}