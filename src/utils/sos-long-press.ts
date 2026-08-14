export const SOS_HOLD_MS = 3000;
export function getSosCountdown(elapsedMs: number) { return Math.max(1, 3 - Math.floor(Math.max(0, elapsedMs) / 1000)); }
export function isSosHoldComplete(elapsedMs: number) { return elapsedMs >= SOS_HOLD_MS; }
