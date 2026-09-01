import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfDay,
  addDays,
} from "date-fns";

export type Period = "jour" | "semaine" | "mois" | "trimestre" | "annee";

export function periodRange(period: Period, ref: Date = new Date()) {
  let start: Date;
  switch (period) {
    case "jour":
      start = startOfDay(ref);
      break;
    case "semaine":
      start = startOfWeek(ref, { weekStartsOn: 1 });
      break;
    case "mois":
      start = startOfMonth(ref);
      break;
    case "trimestre":
      start = startOfQuarter(ref);
      break;
    case "annee":
      start = startOfYear(ref);
      break;
  }
  const end = addDays(endOfDay(ref), 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function todayRange(ref: Date = new Date()) {
  return periodRange("jour", ref);
}

export function yesterdayRange() {
  const y = addDays(new Date(), -1);
  return periodRange("jour", y);
}
