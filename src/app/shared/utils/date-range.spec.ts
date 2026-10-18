import { computePresetRange } from './date-range';

describe('computePresetRange', () => {
  it('harian: mengembalikan tanggal hari ini untuk from dan to', () => {
    const now = new Date('2026-10-14T10:00:00');
    expect(computePresetRange('harian', now)).toEqual({ from: '2026-10-14', to: '2026-10-14' });
  });

  it('mingguan: Senin-Minggu minggu berjalan, saat now di tengah minggu (Rabu)', () => {
    const now = new Date('2026-10-14T10:00:00'); // Rabu
    expect(computePresetRange('mingguan', now)).toEqual({ from: '2026-10-12', to: '2026-10-18' });
  });

  it('mingguan: tetap benar saat now jatuh di hari Minggu (edge case)', () => {
    const now = new Date('2026-10-18T10:00:00'); // Minggu
    expect(computePresetRange('mingguan', now)).toEqual({ from: '2026-10-12', to: '2026-10-18' });
  });

  it('mingguan: tetap benar saat now jatuh di hari Senin (edge case)', () => {
    const now = new Date('2026-10-12T10:00:00'); // Senin
    expect(computePresetRange('mingguan', now)).toEqual({ from: '2026-10-12', to: '2026-10-18' });
  });

  it('bulanan: tanggal 1 sampai akhir bulan berjalan (bulan 28 hari)', () => {
    const now = new Date('2026-02-15T10:00:00');
    expect(computePresetRange('bulanan', now)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('bulanan: menangani tahun kabisat dengan benar (Februari 29 hari)', () => {
    const now = new Date('2028-02-10T10:00:00');
    expect(computePresetRange('bulanan', now)).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('tahunan: 1 Januari sampai 31 Desember tahun berjalan', () => {
    const now = new Date('2026-07-01T10:00:00');
    expect(computePresetRange('tahunan', now)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});