import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocationService, LocationWithCount } from '../../../../core/services/location.service';

type PageToken = number | '…';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './location-list.html',
  styleUrl: './location-list.css',
})
export class LocationList implements OnInit {
  private readonly locationService = inject(LocationService);

  readonly locations = signal<LocationWithCount[]>([]);
  readonly isLoading = signal(true);
  readonly searchTerm = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly skeletonSlots = [1, 2, 3, 4];

  readonly pageSize = 10;
  private readonly currentPage = signal(1);

  /** Ikon SVG (atribut "d"), dipakai ulang di template. */
  readonly icons = {
    plus: 'M12 5v14M5 12h14',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
    reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
    pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z M12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    trash: 'M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
    empty: 'M20 7H4a1 1 0 00-1 1v3h18V8a1 1 0 00-1-1z M3 11v8a1 1 0 001 1h16a1 1 0 001-1v-8 M9 15h6',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
  };

  /** Hasil pencarian (nama atau deskripsi) — logika lama, tidak diubah. */
  readonly filteredLocations = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    if (!query) return this.locations();
    return this.locations().filter((location) =>
      `${location.name} ${location.description ?? ''}`.toLocaleLowerCase().includes(query),
    );
  });

  /** 3 kartu statistik (dihitung dari seluruh data, bukan hasil pencarian). */
  readonly summary = computed(() => {
    const all = this.locations();
    return [
      { label: 'Total Lokasi', value: all.length, desc: 'Lokasi penyimpanan barang', tone: 'blue', icon: this.icons.pin },
      { label: 'Total Barang', value: all.reduce((sum, l) => sum + l.item_count, 0), desc: 'Barang yang sudah punya lokasi', tone: 'green', icon: this.icons.box },
      { label: 'Lokasi Kosong', value: all.filter((l) => l.item_count === 0).length, desc: 'Belum menyimpan barang apa pun', tone: 'amber', icon: this.icons.empty },
    ];
  });

  /* ---------- Pagination ---------- */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredLocations().length / this.pageSize)));
  /** Halaman aktif yang aman (tidak melebihi total halaman, misal setelah hapus data). */
  readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedLocations = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredLocations().slice(start, start + this.pageSize);
  });
  readonly rangeFrom = computed(() => (this.filteredLocations().length ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize, this.filteredLocations().length));

  readonly pageTokens = computed<PageToken[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
  });

  async ngOnInit(): Promise<void> {
    await this.reloadLocations();
  }

  async reloadLocations(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      this.locations.set(await this.locationService.listWithItemCount());
    } catch {
      this.errorMessage.set('Terjadi kendala saat mengambil data. Silakan coba lagi.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDelete(location: LocationWithCount): Promise<void> {
    const message =
      location.item_count > 0
        ? `Lokasi ini dipakai oleh ${location.item_count} barang. Barang tersebut akan kehilangan lokasinya (tidak ikut terhapus). Lanjutkan hapus?`
        : 'Hapus lokasi ini?';
    if (!confirm(message)) return;
    try {
      await this.locationService.delete(location.id);
      await this.reloadLocations();
    } catch {
      this.errorMessage.set('Lokasi gagal dihapus. Silakan coba lagi.');
    }
  }

  /* ---------- Pencarian & halaman ---------- */
  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  goTo(p: number): void {
    this.currentPage.set(Math.min(Math.max(1, p), this.totalPages()));
  }
}