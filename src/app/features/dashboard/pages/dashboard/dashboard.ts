import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, AdminDashboardStats } from '../../../../core/services/dashboard.service';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

type Point = { x: number; y: number; label: string };
type ActivityKind = 'in' | 'out' | 'loan' | 'other';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly stats = signal<AdminDashboardStats | null>(null);
  readonly skeletonSlots = [0, 1, 2, 3, 4, 5];

  /** Tanggal hari ini untuk header, misalnya "Kamis, 15 Oktober 2026". */
  readonly todayLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  /** Path ikon (atribut "d" milik SVG), dipakai ulang di template. */
  readonly icons: Record<string, string> = {
    box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
    dashboard: 'M4.5 3h4A1.5 1.5 0 0 1 10 4.5v4A1.5 1.5 0 0 1 8.5 10h-4A1.5 1.5 0 0 1 3 8.5v-4A1.5 1.5 0 0 1 4.5 3z M15.5 3h4A1.5 1.5 0 0 1 21 4.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 8.5v-4A1.5 1.5 0 0 1 15.5 3z M4.5 14h4A1.5 1.5 0 0 1 10 15.5v4A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5v-4A1.5 1.5 0 0 1 4.5 14z M15.5 14h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4a1.5 1.5 0 0 1 1.5-1.5z',
    grid: 'M4 4h16v16H4z M4 10h16 M4 15h16 M10 4v16',
    diamond: 'M12 3l9 9-9 9-9-9z M12 8l4 4-4 4-4-4z',
    pin: 'M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z M12 8a2 2 0 100 4 2 2 0 000-4z',
    in: 'M12 3v12 M7 10l5 5 5-5 M4 17v3h16v-3',
    out: 'M12 15V3 M7 8l5-5 5 5 M4 17v3h16v-3',
    clock: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2',
    chevron: 'M9 6l6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    calendar: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7z M4 10h16 M8 3v4 M16 3v4',
    alert: 'M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z',
    check: 'M5 12l5 5L20 7',
  };

  private readonly catColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#94a3b8', '#ec4899'];

  /** Data 6 kartu statistik. */
  readonly cards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total Barang', value: s.totalItems, desc: 'Data seluruh barang inventaris', tone: 'blue', icon: 'box', link: '/items' },
      { label: 'Total Stok', value: s.totalPhysicalStock, desc: 'Jumlah fisik stok barang', tone: 'green', icon: 'grid', link: '/items' },
      { label: 'Total Kategori', value: s.totalCategories, desc: 'Kategori barang inventaris', tone: 'violet', icon: 'diamond', link: '/categories' },
      { label: 'Total Lokasi', value: s.totalLocations ?? 0, desc: 'Lokasi penyimpanan barang', tone: 'amber', icon: 'pin', link: '/locations' },
      { label: 'Barang Masuk', value: s.totalIncoming, desc: 'Total barang masuk (bulan ini)', tone: 'teal', icon: 'in', link: '/incoming' },
      { label: 'Barang Keluar', value: s.totalOutgoing, desc: 'Total barang keluar (bulan ini)', tone: 'rose', icon: 'out', link: '/outgoing' },
    ];
  });

  /** Menghitung garis, area, dan sumbu grafik dari stockTrend. */
  readonly chart = computed(() => {
    const data = this.stats()?.stockTrend ?? [];
    if (!data.length) return null;

    const W = 640, H = 230, L = 44, R = 16, T = 16, B = 28;
    const max = Math.max(100, Math.ceil(Math.max(...data.map(d => d.value)) / 100) * 100);
    const stepX = data.length > 1 ? (W - L - R) / (data.length - 1) : 0;

    const pts: Point[] = data.map((d, i) => ({
      x: L + i * stepX,
      y: T + (H - T - B) * (1 - d.value / max),
      label: d.label,
    }));

    const line = this.smoothPath(pts);
    const area = `${line} L ${pts[pts.length - 1].x} ${H - B} L ${pts[0].x} ${H - B} Z`;
    const ticks = Array.from({ length: 6 }, (_, i) => {
      const v = (max / 5) * i;
      return { v, y: T + (H - T - B) * (1 - v / max) };
    });

    return { W, H, L, R, B, pts, line, area, ticks };
  });

  /** Data donut kategori: persentase + warna + gradient. */
  readonly categories = computed(() => {
    const list = this.stats()?.categoryBreakdown ?? [];
    const total = list.reduce((a, c) => a + c.count, 0);
    if (!total) return null;

    let acc = 0;
    const parts: string[] = [];
    const rows = list.map((c, i) => {
      const pct = (c.count / total) * 100;
      const color = this.catColors[i % this.catColors.length];
      parts.push(`${color} ${acc}% ${acc + pct}%`);
      acc += pct;
      return { ...c, pct: Math.round(pct), color };
    });

    return { rows, total: list.length, gradient: `conic-gradient(${parts.join(', ')})` };
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  /** Memuat data dashboard (juga dipakai tombol "Muat Ulang"). */
  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.stats.set(await this.dashboardService.getAdminStats());
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Kurva halus (Catmull-Rom → Bezier) lewat semua titik. */
  private smoothPath(p: Point[]): string {
    if (p.length < 2) return `M ${p[0].x} ${p[0].y}`;
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] ?? p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  formatDate(value: string | Date): string {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(value));
  }

  timeAgo(value: string | Date): string {
    const diff = Date.now() - new Date(value).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Baru saja';
    if (min < 60) return `${min} menit yang lalu`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} jam yang lalu`;
    return `${Math.floor(hr / 24)} hari yang lalu`;
  }

  /** Mengelompokkan aktivitas dari teks deskripsinya. */
  private activityKind(description?: string): ActivityKind {
    const text = (description ?? '').toLowerCase();
    if (text.includes('barang masuk')) return 'in';
    if (text.includes('barang keluar')) return 'out';
    if (text.includes('pengajuan') || text.includes('pinjam') || text.includes('kembali')) return 'loan';
    return 'other';
  }

  /** Nama ikon untuk aktivitas (kunci di objek `icons`). */
  activityIcon(description?: string): string {
    const kind = this.activityKind(description);
    return kind === 'in' ? 'in' : kind === 'out' ? 'out' : kind === 'loan' ? 'clock' : 'box';
  }

  /** Kelas warna ikon aktivitas (lihat CSS: .act-in, .act-out, .act-loan, .act-other). */
  activityTone(description?: string): string {
    return 'act-' + this.activityKind(description);
  }

  activityTitle(a: { description: string }): string {
    const kind = this.activityKind(a.description);
    return kind === 'in' ? 'Barang Masuk'
      : kind === 'out' ? 'Barang Keluar'
      : kind === 'loan' ? 'Peminjaman'
      : 'Aktivitas';
  }
}