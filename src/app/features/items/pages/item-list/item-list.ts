import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemService } from '../../../../core/services/item.service';
import { CategoryService } from '../../../../core/services/category.service';
import { LocationService } from '../../../../core/services/location.service';
import { ItemWithRelations } from '../../../../core/models/item.model';
import { Category } from '../../../../core/models/category.model';
import { StorageLocation } from '../../../../core/models/location.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

type SortField = 'name' | 'stock' | 'purchase_date';
type PageToken = number | '…';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './item-list.html',
  styleUrl: './item-list.css',
})
export class ItemList implements OnInit {
  readonly errorMessage = signal<string | null>(null);
  private readonly itemService = inject(ItemService);
  private readonly categoryService = inject(CategoryService);
  private readonly locationService = inject(LocationService);

  readonly items = signal<ItemWithRelations[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly locations = signal<StorageLocation[]>([]);
  readonly isLoading = signal(true);

  readonly searchTerm = signal('');
  readonly categoryFilter = signal('');
  readonly locationFilter = signal('');
  readonly conditionFilter = signal('');
  readonly sortField = signal<SortField>('name');

  /** Pagination */
  readonly pageSize = 10;
  private readonly currentPage = signal(1);

  /** Baris yang dicentang (menyimpan id barang). */
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly skeletonRows = [0, 1, 2, 3, 4];

  /** Ikon SVG (atribut "d"), dipakai ulang di template. */
  readonly icons = {
    plus: 'M12 5v14M5 12h14',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
    pin: 'M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z M12 8a2 2 0 100 4 2 2 0 000-4z',
    eye: 'M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z M12 9a3 3 0 100 6 3 3 0 000-6z',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    trash: 'M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
    wrench: 'M14.7 6.3a4 4 0 005 5L21 13l-8 8a2.8 2.8 0 01-4-4l8-8z M14.7 6.3L11 10',
    alert: 'M12 3l10 18H2L12 3z M12 10v5 M12 18h.01',
    reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    image: 'M4 5h16v14H4z M4 15l5-5 4 4 3-3 4 4',
  };

  /** Hasil filter + urutan (logika lama, tidak diubah). */
  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.categoryFilter();
    const location = this.locationFilter();
    const condition = this.conditionFilter();

    const filtered = this.items().filter((item) => {
      const matchesTerm =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        (item.category_name ?? '').toLowerCase().includes(term);
      const matchesCategory = !category || item.category_id === category;
      const matchesLocation = !location || item.location_id === location;
      const matchesCondition = !condition || item.condition === condition;
      return matchesTerm && matchesCategory && matchesLocation && matchesCondition;
    });

    const sort = this.sortField();
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'stock') return b.stock - a.stock;
      const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
      const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
      return dateB - dateA;
    });
  });

  /** 4 kartu statistik (dihitung dari seluruh data, bukan hasil filter). */
  readonly summary = computed(() => {
    const all = this.items();
    return [
      { label: 'Total Barang', value: all.length, desc: 'Seluruh barang inventaris', tone: 'blue', icon: this.icons.box },
      { label: 'Barang Tersedia', value: all.filter((i) => i.condition === 'baik').length, desc: 'Barang dalam kondisi baik', tone: 'green', icon: this.icons.box },
      { label: 'Dalam Perbaikan', value: all.filter((i) => i.condition === 'rusak_ringan').length, desc: 'Sedang diperbaiki', tone: 'amber', icon: this.icons.wrench },
      { label: 'Rusak / Hilang', value: all.filter((i) => i.condition === 'rusak_berat').length, desc: 'Perlu penanganan', tone: 'red', icon: this.icons.alert },
    ];
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)));
  /** Halaman aktif yang sudah aman (tidak melebihi total halaman, misal setelah hapus data). */
  readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });
  readonly rangeFrom = computed(() => (this.filteredItems().length ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize, this.filteredItems().length));

  /** Nomor halaman: 1 2 3 4 5 … 26 */
  readonly pageTokens = computed<PageToken[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
  });

  readonly allSelected = computed(() => {
    const rows = this.pagedItems();
    const sel = this.selectedIds();
    return rows.length > 0 && rows.every((r) => sel.has(r.id));
  });

  async ngOnInit(): Promise<void> {
    const [items, categories, locations] = await Promise.all([
      this.itemService.list(),
      this.categoryService.list(),
      this.locationService.list(),
    ]);
    this.items.set(items);
    this.categories.set(categories);
    this.locations.set(locations);
    this.isLoading.set(false);
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const items = await this.itemService.list();
      this.items.set(items);
      this.selectedIds.set(new Set());
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDelete(item: ItemWithRelations): Promise<void> {
    if (!confirm(`Hapus barang "${item.name}"? Riwayat transaksi terkait tetap akan tersimpan.`)) return;

    this.errorMessage.set(null);
    try {
      await this.itemService.delete(item.id);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    }
  }

  /* ---------- Filter (selalu kembali ke halaman 1) ---------- */
  onSearch(v: string) { this.searchTerm.set(v); this.currentPage.set(1); }
  onCategory(v: string) { this.categoryFilter.set(v); this.currentPage.set(1); }
  onLocation(v: string) { this.locationFilter.set(v); this.currentPage.set(1); }
  onCondition(v: string) { this.conditionFilter.set(v); this.currentPage.set(1); }

  resetFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.locationFilter.set('');
    this.conditionFilter.set('');
    this.currentPage.set(1);
  }

  /* ---------- Pagination ---------- */
  goTo(p: number): void {
    this.currentPage.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  /* ---------- Checkbox ---------- */
  toggleAll(checked: boolean): void {
    const next = new Set(this.selectedIds());
    for (const row of this.pagedItems()) checked ? next.add(row.id) : next.delete(row.id);
    this.selectedIds.set(next);
  }

  toggleOne(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    checked ? next.add(id) : next.delete(id);
    this.selectedIds.set(next);
  }

  /* ---------- Tampilan ---------- */
  /** Warna badge kategori bergantian berdasarkan urutan kategori. */
  categoryTone(categoryId: string | null | undefined): string {
    const idx = this.categories().findIndex((c) => c.id === categoryId);
    return 'cat-' + (idx < 0 ? 0 : idx % 6);
  }

  statusLabel(condition: string): string {
    return condition === 'baik' ? 'Tersedia' : condition === 'rusak_ringan' ? 'Dalam Perbaikan' : 'Rusak';
  }

  statusClass(condition: string): string {
    return condition === 'baik' ? 'st-ok' : condition === 'rusak_ringan' ? 'st-fix' : 'st-bad';
  }

  /** Foto barang: dipakai jika model punya field image_url, kalau tidak tampil ikon. */
  imageOf(item: ItemWithRelations): string | null {
    return (item as ItemWithRelations & { image_url?: string | null }).image_url ?? null;
  }
}