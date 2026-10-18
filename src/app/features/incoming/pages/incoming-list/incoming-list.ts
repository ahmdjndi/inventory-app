import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StockMovementService } from '../../../../core/services/stock-movement.service';
import { StockMovementWithDetails } from '../../../../core/models/stock-movement.model';

type SortOrder = 'newest' | 'oldest' | 'qty';
type PageToken = number | '…';

/** Mengambil bagian tanggal (YYYY-MM-DD) dari nilai tanggal, untuk perbandingan dan filter. */
function dayKey(value: string | Date): string {
  return typeof value === 'string' ? value.slice(0, 10) : value.toLocaleDateString('en-CA');
}

@Component({
  selector: 'app-incoming-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './incoming-list.html',
  styleUrl: './incoming-list.css',
})
export class IncomingList implements OnInit {
  private readonly stockMovementService = inject(StockMovementService);

  readonly movements = signal<StockMovementWithDetails[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly sortOrder = signal<SortOrder>('newest');

  readonly pageSize = 10;
  private readonly currentPage = signal(1);

  /** Dipakai @for skeleton saat memuat. */
  readonly skeletonRows = [0, 1, 2, 3, 4];

  /** Ikon SVG (atribut "d"), dipakai ulang di template. */
  readonly icons = {
    incoming: 'M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6 M7 10l5 5 5-5 M12 15V3',
    plus: 'M12 5v14M5 12h14',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
    reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
    calendar: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7z M4 10h16 M8 3v4 M16 3v4',
    list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    layers: 'M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 17.5l9 5 9-5',
    alert: 'M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
  };

  /** Hasil pencarian + filter tanggal + urutan. */
  readonly filteredMovements = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();

    const filtered = this.movements().filter((m) => {
      const searchable = [m.item_code, m.item_name, m.source, m.notes, m.recorder_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const day = dayKey(m.transaction_date);
      return (!term || searchable.includes(term)) && (!from || day >= from) && (!to || day <= to);
    });

    const order = this.sortOrder();
    return [...filtered].sort((a, b) => {
      if (order === 'qty') return b.quantity - a.quantity;
      const byDate = dayKey(a.transaction_date).localeCompare(dayKey(b.transaction_date));
      return order === 'oldest' ? byDate : -byDate;
    });
  });

  /** 4 kartu statistik (dihitung dari seluruh data, bukan hasil filter). */
  readonly summary = computed(() => {
    const all = this.movements();
    const now = new Date();
    const thisMonth = all.filter((m) => {
      const d = new Date(m.transaction_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const sum = (list: StockMovementWithDetails[]) => list.reduce((total, m) => total + m.quantity, 0);

    return [
      { label: 'Total Transaksi', value: all.length, desc: 'Seluruh catatan barang masuk', tone: 'blue', icon: this.icons.list },
      { label: 'Total Unit Masuk', value: sum(all), desc: 'Jumlah seluruh unit masuk', tone: 'green', icon: this.icons.incoming },
      { label: 'Masuk Bulan Ini', value: sum(thisMonth), desc: `${thisMonth.length} transaksi bulan ini`, tone: 'cyan', icon: this.icons.calendar },
      { label: 'Jenis Barang', value: new Set(all.map((m) => m.item_code)).size, desc: 'Barang berbeda yang pernah masuk', tone: 'violet', icon: this.icons.layers },
    ];
  });

  /* ---------- Pagination ---------- */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredMovements().length / this.pageSize)));
  readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedMovements = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredMovements().slice(start, start + this.pageSize);
  });
  readonly rangeFrom = computed(() => (this.filteredMovements().length ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize, this.filteredMovements().length));

  readonly pageTokens = computed<PageToken[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.movements.set(await this.stockMovementService.listIncoming());
    } catch {
      this.errorMessage.set('Gagal memuat data barang masuk. Silakan coba lagi.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /* ---------- Filter (selalu kembali ke halaman 1) ---------- */
  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onDateFrom(value: string): void {
    this.dateFrom.set(value);
    this.currentPage.set(1);
  }

  onDateTo(value: string): void {
    this.dateTo.set(value);
    this.currentPage.set(1);
  }

  onSort(value: string): void {
    this.sortOrder.set(value as SortOrder);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.sortOrder.set('newest');
    this.currentPage.set(1);
  }

  goTo(p: number): void {
    this.currentPage.set(Math.min(Math.max(1, p), this.totalPages()));
  }
}