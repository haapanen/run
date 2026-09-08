export type TimeValue = {
  hours: string;
  minutes: string;
  seconds: string;
};

export function timeToSeconds(value: TimeValue) {
  return (
    Number(value.hours) * 3600 +
    Number(value.minutes) * 60 +
    Number(value.seconds)
  );
}