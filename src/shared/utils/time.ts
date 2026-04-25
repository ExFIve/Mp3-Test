export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const whole = Math.round(seconds);
  const min = Math.floor(whole / 60);
  const sec = whole % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
