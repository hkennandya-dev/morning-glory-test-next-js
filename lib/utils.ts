import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getTimezoneOffset } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOffset(ms: number): string {
  const totalMinutes = ms / 60_000;
  const sign = totalMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(totalMinutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

export function buildDatetime(val: string): string {
  const padded = val.length === 5 ? `${val}:00` : val;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const msOffset = getTimezoneOffset(tz, new Date());
  const offset = formatOffset(msOffset);
  return `1999-01-01T${padded}${offset}`;
}

export function extractTimeOnly(datetime: string): string {
  const timeWithZone = datetime.split(' ')[1];
  const timeOnly = timeWithZone.split('+')[0].split('-')[0];
  return timeOnly;
}