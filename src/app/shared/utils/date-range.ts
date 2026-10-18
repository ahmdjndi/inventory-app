export type PeriodPreset = 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'kustom';

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computePresetRange(
  preset: PeriodPreset,
  now: Date = new Date()
): { from: string; to: string } {
  if (preset === 'harian') {
    return { from: toDateString(now), to: toDateString(now) };
  }
  if (preset === 'mingguan') {
    const day = now.getDay() === 0 ? 7 : now.getDay(); // Senin=1 ... Minggu=7
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: toDateString(monday), to: toDateString(sunday) };
  }
  if (preset === 'bulanan') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toDateString(first), to: toDateString(last) };
  }
  if (preset === 'tahunan') {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }
  return { from: toDateString(now), to: toDateString(now) };
}