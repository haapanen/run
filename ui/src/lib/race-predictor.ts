export const raceDistances = [
  { label: "400 m", km: 0.4 },
  { label: "800 m", km: 0.8 },
  { label: "1 mile", km: 1.609344 },
  { label: "3K", km: 3 },
  { label: "5K", km: 5 },
  { label: "10K", km: 10 },
  { label: "15K", km: 15 },
  { label: "Half marathon", km: 21.0975 },
  { label: "Marathon", km: 42.195 },
  { label: "50K", km: 50 },
] as const;

export type PredictionModel = {
  name: string;
  shortName: string;
  description: string;
  seconds?: number;
  distanceKm?: number;
  unavailableReason?: string;
};

export type Prediction = {
  models: PredictionModel[];
  averageSeconds?: number;
  averageDistanceKm?: number;
};

export type CriticalSpeedEffort = {
  seconds: number;
  distanceKm: number;
};

export type DistanceUnit = "km" | "mi";

const KM_PER_MILE = 1.609344;

const RIEGEL_EXPONENT = 1.06;

function riegelTime(
  previousSeconds: number,
  previousDistanceKm: number,
  targetDistanceKm: number,
) {
  return (
    previousSeconds *
    Math.pow(targetDistanceKm / previousDistanceKm, RIEGEL_EXPONENT)
  );
}

function vdotForPerformance(distanceKm: number, seconds: number) {
  const minutes = seconds / 60;
  const velocity = (distanceKm * 1000) / minutes;
  const oxygenCost =
    -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  const sustainableFraction =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * minutes) +
    0.2989558 * Math.exp(-0.1932605 * minutes);

  return oxygenCost / sustainableFraction;
}

function vdotTime(
  previousSeconds: number,
  previousDistanceKm: number,
  targetDistanceKm: number,
) {
  const targetVdot = vdotForPerformance(previousDistanceKm, previousSeconds);
  let lowSeconds = Math.max(30, targetDistanceKm * 60);
  let highSeconds = Math.max(previousSeconds * 20, targetDistanceKm * 3600);

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (lowSeconds + highSeconds) / 2;
    if (vdotForPerformance(targetDistanceKm, midpoint) > targetVdot) {
      lowSeconds = midpoint;
    } else {
      highSeconds = midpoint;
    }
  }

  return (lowSeconds + highSeconds) / 2;
}

function criticalSpeedParameters(
  previousSeconds: number,
  previousDistanceKm: number,
  secondEffort?: CriticalSpeedEffort,
) {
  if (
    !secondEffort ||
    secondEffort.seconds <= 0 ||
    secondEffort.distanceKm <= 0 ||
    secondEffort.seconds === previousSeconds
  ) {
    return undefined;
  }

  const criticalSpeed =
    (secondEffort.distanceKm - previousDistanceKm) /
    (secondEffort.seconds - previousSeconds);
  const distancePrime = previousDistanceKm - criticalSpeed * previousSeconds;

  if (criticalSpeed <= 0 || distancePrime <= 0) return undefined;

  return { criticalSpeed, distancePrime };
}

function cameronFactor(distanceKm: number) {
  return (
    13.49681 - 0.048865 * distanceKm + 2.438936 / Math.pow(distanceKm, 0.7905)
  );
}

function cameronTime(
  previousSeconds: number,
  previousDistanceKm: number,
  targetDistanceKm: number,
) {
  return (
    previousSeconds *
    (targetDistanceKm / previousDistanceKm) *
    (cameronFactor(previousDistanceKm) / cameronFactor(targetDistanceKm))
  );
}

function approximately(value: number, expected: number) {
  return Math.abs(value - expected) <= expected * 0.01;
}

function heuristicTime(
  previousSeconds: number,
  previousDistanceKm: number,
  targetDistanceKm: number,
) {
  if (
    approximately(previousDistanceKm, 5) &&
    approximately(targetDistanceKm, 10)
  ) {
    return previousSeconds * 2.12;
  }
  if (
    approximately(previousDistanceKm, 10) &&
    approximately(targetDistanceKm, 21.0975)
  ) {
    return previousSeconds * 2 + 11 * 60;
  }
  if (
    approximately(previousDistanceKm, 21.0975) &&
    approximately(targetDistanceKm, 42.195)
  ) {
    return previousSeconds * 2 + 12.5 * 60;
  }

  return undefined;
}

const timeModels = [
  {
    name: "Riegel's formula",
    shortName: "Riegel",
    description: "Fixed 1.06 fatigue exponent",
    calculate: riegelTime,
  },
  {
    name: "VDOT tables",
    shortName: "VDOT",
    description: "Daniels VDOT performance equations",
    calculate: vdotTime,
  },
  {
    name: "Dave Cameron model",
    shortName: "Cameron",
    description: "Distance-adjusted Cameron speed factors",
    calculate: cameronTime,
  },
] as const;

function solveDistanceForTime(
  calculateTime: (
    seconds: number,
    distanceKm: number,
    targetKm: number,
  ) => number,
  previousSeconds: number,
  previousDistanceKm: number,
  targetSeconds: number,
) {
  let lowKm = 0.05;
  let highKm = 500;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (lowKm + highKm) / 2;
    if (
      calculateTime(previousSeconds, previousDistanceKm, midpoint) <
      targetSeconds
    ) {
      lowKm = midpoint;
    } else {
      highKm = midpoint;
    }
  }

  return (lowKm + highKm) / 2;
}

export function predictForDistance(
  previousSeconds: number,
  previousDistanceKm: number,
  targetDistanceKm: number,
  criticalSpeedEffort?: CriticalSpeedEffort,
): Prediction {
  if (
    previousSeconds <= 0 ||
    previousDistanceKm <= 0 ||
    targetDistanceKm <= 0
  ) {
    return { models: [] };
  }

  const models: PredictionModel[] = timeModels.map((model) => ({
    name: model.name,
    shortName: model.shortName,
    description: model.description,
    seconds: model.calculate(
      previousSeconds,
      previousDistanceKm,
      targetDistanceKm,
    ),
  }));
  const criticalSpeed = criticalSpeedParameters(
    previousSeconds,
    previousDistanceKm,
    criticalSpeedEffort,
  );
  const criticalSpeedSeconds = criticalSpeed
    ? (targetDistanceKm - criticalSpeed.distancePrime) /
      criticalSpeed.criticalSpeed
    : undefined;
  models.splice(2, 0, {
    name: "Critical Speed & D′",
    shortName: "CS / D′",
    description: "Two-effort linear critical speed fit",
    ...(criticalSpeedSeconds !== undefined && criticalSpeedSeconds > 0
      ? { seconds: criticalSpeedSeconds }
      : {
          unavailableReason:
            "Enter two valid maximal efforts with different distances.",
        }),
  });
  const heuristic = heuristicTime(
    previousSeconds,
    previousDistanceKm,
    targetDistanceKm,
  );
  models.push({
    name: "Practical heuristic",
    shortName: "Heuristic",
    description: "Midpoint of common coaching rules of thumb",
    ...(heuristic === undefined
      ? {
          unavailableReason:
            "Available for 5K → 10K, 10K → half, and half → marathon.",
        }
      : { seconds: heuristic }),
  });

  const available = models.flatMap((model) =>
    model.seconds === undefined ? [] : [model.seconds],
  );
  return {
    models,
    averageSeconds:
      available.reduce((total, seconds) => total + seconds, 0) /
      available.length,
  };
}

export function predictForTime(
  previousSeconds: number,
  previousDistanceKm: number,
  targetSeconds: number,
  criticalSpeedEffort?: CriticalSpeedEffort,
): Prediction {
  if (previousSeconds <= 0 || previousDistanceKm <= 0 || targetSeconds <= 0) {
    return { models: [] };
  }

  const models: PredictionModel[] = timeModels.map((model) => ({
    name: model.name,
    shortName: model.shortName,
    description: model.description,
    distanceKm: solveDistanceForTime(
      model.calculate,
      previousSeconds,
      previousDistanceKm,
      targetSeconds,
    ),
  }));
  const criticalSpeed = criticalSpeedParameters(
    previousSeconds,
    previousDistanceKm,
    criticalSpeedEffort,
  );
  const criticalSpeedDistance = criticalSpeed
    ? criticalSpeed.distancePrime + criticalSpeed.criticalSpeed * targetSeconds
    : undefined;
  models.splice(2, 0, {
    name: "Critical Speed & D′",
    shortName: "CS / D′",
    description: "Two-effort linear critical speed fit",
    ...(criticalSpeedDistance !== undefined && criticalSpeedDistance > 0
      ? { distanceKm: criticalSpeedDistance }
      : {
          unavailableReason:
            "Enter two valid maximal efforts with different distances.",
        }),
  });
  models.push({
    name: "Practical heuristic",
    shortName: "Heuristic",
    description: "Rules of thumb require a standard target distance",
    unavailableReason: "Select a target distance to use this model.",
  });

  const available = models.flatMap((model) =>
    model.distanceKm === undefined ? [] : [model.distanceKm],
  );
  return {
    models,
    averageDistanceKm:
      available.reduce((total, distance) => total + distance, 0) /
      available.length,
  };
}

export function formatRaceTime(seconds: number | undefined) {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return "—";
  }

  const roundedSeconds = Math.round(seconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatPace(
  seconds: number | undefined,
  distanceKm: number | undefined,
  unit: DistanceUnit = "km",
) {
  if (
    distanceKm === undefined ||
    distanceKm <= 0 ||
    !Number.isFinite(distanceKm)
  ) {
    return "—";
  }
  const distance = unit === "mi" ? distanceKm / KM_PER_MILE : distanceKm;
  return `${formatRaceTime(seconds === undefined ? undefined : seconds / distance)} min/${unit}`;
}

export function formatDistance(
  distanceKm: number | undefined,
  unit: DistanceUnit = "km",
) {
  if (
    distanceKm === undefined ||
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0
  ) {
    return "—";
  }
  const distance = unit === "mi" ? distanceKm / KM_PER_MILE : distanceKm;
  return `${distance.toFixed(distance < 10 ? 2 : 1)} ${unit}`;
}
