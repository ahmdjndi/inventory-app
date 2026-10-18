import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityLogService } from '../../../../core/services/activity-log.service';
import { StockReportService } from '../../../../core/services/stock-report.service';
import { ExportService, ExportColumn } from '../../../../core/services/export.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivityLogEntry, ActivityType } from '../../../../core/models/activity-log.model';
import { StockReportEntry } from '../../../../core/models/stock-report.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';
import { PeriodPreset, toDateString, computePresetRange } from '../../../../shared/utils/date-range';

type MainTab = 'riwayat' | 'stok';
type FilterGroupId = 'semua' | 'barang_masuk' | 'barang_keluar' | 'peminjaman' | 'pengembalian';
type PageToken = number | '…';

interface SummaryCard {
  label: string;
  value: number;
  desc: string;
  tone: string;
  icon: string;
}

/** Ikon SVG (isi atribut "d" milik <path>), dipakai ulang di template. */
const ICONS = {
  history: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5 M12 8v4l3 2',
  stock: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  incoming: 'M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6 M7 10l5 5 5-5 M12 15V3',
  outgoing: 'M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6 M17 8l-5-5-5 5 M12 3v12',
  clipboard: 'M9 3h6v3H9z M8 4.5H6a2 2 0 00-2 2V20a1 1 0 001 1h14a1 1 0 001-1V6.5a2 2 0 00-2-2h-2 M9 13l2 2 4-4',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2',
  checkCircle: 'M12 3a9 9 0 100 18 9 9 0 000-18z M8.5 12.5l2.5 2.5 4.5-5',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  flag: 'M5 21V4 M5 4h12l-2 4 2 4H5',
  xCircle: 'M12 3a9 9 0 100 18 9 9 0 000-18z M9 9l6 6 M15 9l-6 6',
  ban: 'M12 3a9 9 0 100 18 9 9 0 000-18z M5.6 5.6l12.8 12.8',
  back: 'M3 12a9 9 0 111 6.7 M3 12V7 M3 12h5',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
  reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
  file: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z M9 13h6 M9 17h6',
  alert: 'M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
} as const;

interface FilterGroup {
  id: FilterGroupId;
  label: string;
  types: ActivityType[] | null; // null = semua
  adminOnly: boolean;
}

const FILTER_GROUPS: FilterGroup[] = [
  { id: 'semua', label: 'Semua', types: null, adminOnly: false },
  { id: 'barang_masuk', label: 'Barang Masuk', types: ['stock_in'], adminOnly: true },
  { id: 'barang_keluar', label: 'Barang Keluar', types: ['stock_out'], adminOnly: true },
  { id: 'peminjaman', label: 'Peminjaman', types: ['loan_dipinjam'], adminOnly: false },
  { id: 'pengembalian', label: 'Pengembalian', types: ['loan_return_item', 'loan_dikembalikan'], adminOnly: false },
];

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  stock_in: 'Barang Masuk',
  stock_out: 'Barang Keluar',
  loan_pending: 'Pengajuan Dibuat',
  loan_disetujui: 'Disetujui',
  loan_dipinjam: 'Dipinjam',
  loan_dikembalikan: 'Selesai',
  loan_ditolak: 'Ditolak',
  loan_dibatalkan: 'Dibatalkan',
  loan_return_item: 'Pengembalian Barang',
};

/** Nama kelas warna per jenis aktivitas (lihat CSS: .a-in, .a-out, dst). */
const ACTIVITY_TONE: Record<ActivityType, string> = {
  stock_in: 'a-in',
  stock_out: 'a-out',
  loan_pending: 'a-pending',
  loan_disetujui: 'a-approved',
  loan_dipinjam: 'a-handed',
  loan_dikembalikan: 'a-done',
  loan_ditolak: 'a-rejected',
  loan_dibatalkan: 'a-cancel',
  loan_return_item: 'a-return',
};

const ACTIVITY_ICON: Record<ActivityType, string> = {
  stock_in: ICONS.incoming,
  stock_out: ICONS.outgoing,
  loan_pending: ICONS.clock,
  loan_disetujui: ICONS.checkCircle,
  loan_dipinjam: ICONS.arrow,
  loan_dikembalikan: ICONS.flag,
  loan_ditolak: ICONS.xCircle,
  loan_dibatalkan: ICONS.ban,
  loan_return_item: ICONS.back,
};

/** Warna dan ikon kartu statistik untuk tiap grup filter. */
const GROUP_META: Record<Exclude<FilterGroupId, 'semua'>, { tone: string; icon: string }> = {
  barang_masuk: { tone: 'green', icon: ICONS.incoming },
  barang_keluar: { tone: 'rose', icon: ICONS.outgoing },
  peminjaman: { tone: 'violet', icon: ICONS.clipboard },
  pengembalian: { tone: 'cyan', icon: ICONS.back },
};

const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'harian', label: 'Harian' },
  { key: 'mingguan', label: 'Mingguan' },
  { key: 'bulanan', label: 'Bulanan' },
  { key: 'tahunan', label: 'Tahunan' },
];

const STOCK_STATUSES = ['Tersedia', 'Tidak Tersedia', 'Habis'];

const PAGE_SIZE = 15;
const STOCK_PAGE_SIZE = 15;

/** Nomor halaman: 1 2 3 4 5 … 26 */
function buildPageTokens(cur: number, total: number): PageToken[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', cur - 1, cur, cur + 1, '…', total];
}

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList implements OnInit {
  private readonly activityLogService = inject(ActivityLogService);
  private readonly stockReportService = inject(StockReportService);
  private readonly exportService = inject(ExportService);
  private readonly authService = inject(AuthService);

  readonly icons = ICONS;
  readonly presets = PERIOD_PRESETS;
  readonly stockStatuses = STOCK_STATUSES;
  readonly skeletonRows = [0, 1, 2, 3, 4];

  readonly mainTab = signal<MainTab>('riwayat');
  readonly isAdmin = computed(() => this.authService.isAdmin);

  readonly availableFilterGroups = computed(() =>
    FILTER_GROUPS.filter((g) => !g.adminOnly || this.isAdmin())
  );

  readonly activeFilter = signal<FilterGroupId>('semua');
  readonly activePreset = signal<PeriodPreset>('bulanan');
  readonly customFrom = signal(toDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  readonly customTo = signal(toDateString(new Date()));
  /** Rentang tanggal yang benar-benar sedang dipakai (diisi saat data dimuat). */
  readonly appliedRange = signal({ from: this.customFrom(), to: this.customTo() });

  readonly allActivities = signal<ActivityLogEntry[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly page = signal(1);

  readonly filteredActivities = computed(() => {
    const group = FILTER_GROUPS.find((g) => g.id === this.activeFilter())!;
    const all = this.allActivities();
    return group.types ? all.filter((a) => group.types!.includes(a.activity_type)) : all;
  });

  readonly pagedActivities = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredActivities().slice(start, start + PAGE_SIZE);
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredActivities().length / PAGE_SIZE)));
  readonly rangeFrom = computed(() => (this.filteredActivities().length ? (this.page() - 1) * PAGE_SIZE + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * PAGE_SIZE, this.filteredActivities().length));
  readonly pageTokens = computed(() => buildPageTokens(this.page(), this.totalPages()));

  /** Kartu statistik tab Riwayat (dihitung dari seluruh data periode, bukan hasil filter). */
  readonly summary = computed(() => {
  const all = this.allActivities();
  const cards: SummaryCard[] = [
    { label: 'Total Aktivitas', value: all.length, desc: 'Pada periode terpilih', tone: 'blue', icon: ICONS.list },
  ];
  for (const group of this.availableFilterGroups()) {
    if (!group.types || group.id === 'semua') continue;
    const meta = GROUP_META[group.id];
    cards.push({
      label: group.label,
      value: all.filter((a) => group.types!.includes(a.activity_type)).length,
      desc: 'Pada periode terpilih',
      tone: meta.tone,
      icon: meta.icon,
    });
  }
  return cards;
});

  /* ---------- Laporan stok ---------- */
  readonly stockReport = signal<StockReportEntry[]>([]);
  readonly isLoadingStock = signal(true);
  readonly stockErrorMessage = signal<string | null>(null);
  readonly stockSearch = signal('');
  readonly stockStatus = signal('');
  private readonly stockCurrentPage = signal(1);

  readonly filteredStock = computed(() => {
    const term = this.stockSearch().trim().toLowerCase();
    const status = this.stockStatus();
    return this.stockReport().filter((r) => {
      const text = [r.code, r.name, r.category_name, r.location_name].filter(Boolean).join(' ').toLowerCase();
      return (!term || text.includes(term)) && (!status || r.status === status);
    });
  });

  readonly stockTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredStock().length / STOCK_PAGE_SIZE)));
  readonly stockPage = computed(() => Math.min(this.stockCurrentPage(), this.stockTotalPages()));
  readonly pagedStock = computed(() => {
    const start = (this.stockPage() - 1) * STOCK_PAGE_SIZE;
    return this.filteredStock().slice(start, start + STOCK_PAGE_SIZE);
  });
  readonly stockRangeFrom = computed(() => (this.filteredStock().length ? (this.stockPage() - 1) * STOCK_PAGE_SIZE + 1 : 0));
  readonly stockRangeTo = computed(() => Math.min(this.stockPage() * STOCK_PAGE_SIZE, this.filteredStock().length));
  readonly stockPageTokens = computed(() => buildPageTokens(this.stockPage(), this.stockTotalPages()));

  /** Kartu statistik tab Stok (dihitung dari seluruh data). */
  readonly stockSummary = computed(() => {
    const all = this.stockReport();
    const count = (status: string) => all.filter((r) => r.status === status).length;
    return [
      { label: 'Total Barang', value: all.length, desc: 'Seluruh barang terdata', tone: 'blue', icon: ICONS.stock },
      { label: 'Tersedia', value: count('Tersedia'), desc: 'Siap dipinjam', tone: 'green', icon: ICONS.checkCircle },
      { label: 'Tidak Tersedia', value: count('Tidak Tersedia'), desc: 'Sedang dipakai atau diperiksa', tone: 'amber', icon: ICONS.clock },
      { label: 'Habis', value: count('Habis'), desc: 'Stok kosong', tone: 'rose', icon: ICONS.xCircle },
    ];
  });

  async ngOnInit(): Promise<void> {
    await this.loadActivities();
    this.loadStockReport(); // tidak perlu await — tab Stok independen, memuat paralel
  }

  activityLabel(type: ActivityType): string {
    return ACTIVITY_LABEL[type] ?? type;
  }

  activityTone(type: ActivityType): string {
    return ACTIVITY_TONE[type] ?? 'a-cancel';
  }

  activityIcon(type: ActivityType): string {
    return ACTIVITY_ICON[type] ?? ICONS.list;
  }

  /** Kelas warna badge status stok (lihat CSS: .st-ok, .st-warn, .st-bad). */
  stockStatusClass(status: string): string {
    return status === 'Habis' ? 'st-bad' : status === 'Tidak Tersedia' ? 'st-warn' : 'st-ok';
  }

  async setMainTab(tab: MainTab): Promise<void> {
    this.mainTab.set(tab);
  }

  async setPreset(preset: PeriodPreset): Promise<void> {
    this.activePreset.set(preset);
    if (preset !== 'kustom') {
      const range = computePresetRange(preset);
      this.customFrom.set(range.from);
      this.customTo.set(range.to);
      await this.loadActivities();
    }
  }

  async applyCustomRange(): Promise<void> {
    this.activePreset.set('kustom');
    await this.loadActivities();
  }

  setFilterGroup(id: FilterGroupId): void {
    this.activeFilter.set(id);
    this.page.set(1);
  }

  async goToPage(p: number): Promise<void> {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
  }

  /* ---------- Filter & halaman laporan stok ---------- */
  onStockSearch(value: string): void {
    this.stockSearch.set(value);
    this.stockCurrentPage.set(1);
  }

  onStockStatus(value: string): void {
    this.stockStatus.set(value);
    this.stockCurrentPage.set(1);
  }

  resetStockFilters(): void {
    this.stockSearch.set('');
    this.stockStatus.set('');
    this.stockCurrentPage.set(1);
  }

  goToStockPage(p: number): void {
    this.stockCurrentPage.set(Math.min(Math.max(1, p), this.stockTotalPages()));
  }

  /** Coba muat ulang data tab Riwayat. */
  async retryActivities(): Promise<void> {
    await this.loadActivities();
  }

  /** Coba muat ulang data tab Stok. */
  async retryStock(): Promise<void> {
    await this.loadStockReport();
  }

  private async loadActivities(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.allActivities.set(await this.activityLogService.getLog(this.customFrom(), this.customTo()));
      this.appliedRange.set({ from: this.customFrom(), to: this.customTo() });
      this.page.set(1);
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadStockReport(): Promise<void> {
    this.isLoadingStock.set(true);
    this.stockErrorMessage.set(null);
    try {
      this.stockReport.set(await this.stockReportService.getReport());
    } catch (err) {
      this.stockErrorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoadingStock.set(false);
    }
  }

  private getActivityExportColumns(): ExportColumn<ActivityLogEntry>[] {
    const filter = this.activeFilter();
    if (filter === 'barang_masuk' || filter === 'barang_keluar') {
      return [
        { header: 'Tanggal', accessor: (r) => new Date(r.activity_date).toLocaleString('id-ID') },
        { header: 'Barang', accessor: (r) => r.item_name ?? '-' },
        { header: 'Kode', accessor: (r) => r.item_code ?? '-' },
        { header: 'Jumlah', accessor: (r) => r.quantity ?? 0 },
        { header: 'Dicatat Oleh', accessor: (r) => r.actor_name ?? '-' },
        { header: 'Catatan', accessor: (r) => r.notes ?? '-' },
      ];
    }
    if (filter === 'peminjaman') {
      return [
        { header: 'Tanggal', accessor: (r) => new Date(r.activity_date).toLocaleString('id-ID') },
        { header: 'Kode Transaksi', accessor: (r) => r.transaction_code ?? '-' },
        { header: 'Peminjam', accessor: (r) => r.borrower_name ?? '-' },
        { header: 'Status', accessor: (r) => this.activityLabel(r.activity_type) },
        { header: 'Diproses Oleh', accessor: (r) => r.actor_name ?? '-' },
        { header: 'Catatan', accessor: (r) => r.notes ?? '-' },
      ];
    }
    if (filter === 'pengembalian') {
      return [
        { header: 'Tanggal', accessor: (r) => new Date(r.activity_date).toLocaleString('id-ID') },
        { header: 'Kode Transaksi', accessor: (r) => r.transaction_code ?? '-' },
        { header: 'Peminjam', accessor: (r) => r.borrower_name ?? '-' },
        { header: 'Barang', accessor: (r) => r.item_name ?? '-' },
        { header: 'Jumlah', accessor: (r) => r.quantity ?? 0 },
        { header: 'Kondisi', accessor: (r) => r.condition ?? '-' },
        { header: 'Lengkap', accessor: (r) => (r.complete === null ? '-' : r.complete ? 'Ya' : 'Tidak') },
        { header: 'Terlambat', accessor: (r) => (r.is_late ? 'Ya' : 'Tidak') },
        { header: 'Diproses Oleh', accessor: (r) => r.actor_name ?? '-' },
      ];
    }
    return [
      { header: 'Tanggal', accessor: (r) => new Date(r.activity_date).toLocaleString('id-ID') },
      { header: 'Jenis', accessor: (r) => this.activityLabel(r.activity_type) },
      { header: 'Barang', accessor: (r) => r.item_name ?? '-' },
      { header: 'Jumlah', accessor: (r) => r.quantity ?? '-' },
      { header: 'Peminjam/Pelaku', accessor: (r) => r.borrower_name ?? r.actor_name ?? '-' },
      { header: 'Catatan', accessor: (r) => r.notes ?? '-' },
    ];
  }

  exportActivityExcel(): void {
    const title = `riwayat-${this.activeFilter()}-${this.customFrom()}_${this.customTo()}`;
    this.exportService.exportToExcel(this.filteredActivities(), this.getActivityExportColumns(), title);
  }

  exportActivityPdf(): void {
    const title = `riwayat-${this.activeFilter()}-${this.customFrom()}_${this.customTo()}`;
    this.exportService.exportToPdf(
      this.filteredActivities(),
      this.getActivityExportColumns(),
      title,
      `Riwayat Transaksi (${this.customFrom()} s/d ${this.customTo()})`
    );
  }

  private getStockExportColumns(): ExportColumn<StockReportEntry>[] {
    return [
      { header: 'Kode', accessor: (r) => r.code },
      { header: 'Nama', accessor: (r) => r.name },
      { header: 'Kategori', accessor: (r) => r.category_name ?? '-' },
      { header: 'Lokasi', accessor: (r) => r.location_name ?? '-' },
      { header: 'Stok Fisik', accessor: (r) => r.stock },
      { header: 'Dipinjam', accessor: (r) => r.borrowed },
      { header: 'Direservasi', accessor: (r) => r.reserved },
      { header: 'Dalam Pemeriksaan', accessor: (r) => r.under_inspection },
      { header: 'Tersedia', accessor: (r) => r.available },
      { header: 'Status', accessor: (r) => r.status },
    ];
  }

  exportStockExcel(): void {
    this.exportService.exportToExcel(this.filteredStock(), this.getStockExportColumns(), 'laporan-stok-saat-ini');
  }

  exportStockPdf(): void {
    this.exportService.exportToPdf(
      this.filteredStock(), this.getStockExportColumns(), 'laporan-stok-saat-ini',
      `Laporan Stok Saat Ini (${new Date().toLocaleDateString('id-ID')})`
    );
  }
}