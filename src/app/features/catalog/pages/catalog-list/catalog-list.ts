import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';
import { LoanCartService } from '../../../../core/services/loan-cart.service';
import { ItemCatalogEntry } from '../../../../core/models/item-catalog.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

type PageToken = number | '…';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.css',
})
export class CatalogList implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(LoanCartService);
  private readonly router = inject(Router);

  readonly items = signal<ItemCatalogEntry[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly categoryFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortOrder = signal('newest');

  readonly pageSize = 12;
  private readonly currentPage = signal(1);

  /** Dipakai @for skeleton saat memuat. */
  readonly skeletonCards = [1, 2, 3, 4, 5, 6, 7, 8];

  /** Ikon SVG (atribut "d"), dipakai ulang di template. */
  readonly icons = {
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
    reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
    image: 'M4 5h16v14H4z M4 15l5-5 4 4 3-3 4 4',
    plus: 'M12 5v14M5 12h14',
    close: 'M6 18L18 6M6 6l12 12',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    alert: 'M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z',
  };

  readonly categoryOptions = computed(() => {
    const names = new Set<string>();
    for (const item of this.items()) {
      if (item.category_name) names.add(item.category_name);
    }
    return Array.from(names).sort();
  });

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.categoryFilter();
    const filtered = this.items().filter((item) => {
      const matchesTerm =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        (item.category_name ?? '').toLowerCase().includes(term);
      const matchesCategory = !category || item.category_name === category;
      const matchesStatus =
        !this.statusFilter() ||
        (this.statusFilter() === 'available' ? item.available_stock > 0 : item.available_stock <= 0);
      return matchesTerm && matchesCategory && matchesStatus;
    });
    return filtered.sort((a, b) => {
      if (this.sortOrder() === 'name-asc') return a.name.localeCompare(b.name);
      if (this.sortOrder() === 'name-desc') return b.name.localeCompare(a.name);
      return 0; // urutan bawaan dari service
    });
  });

  /** Apakah ada filter/pencarian yang sedang aktif. */
  readonly hasActiveFilter = computed(
    () => !!(this.searchTerm().trim() || this.categoryFilter() || this.statusFilter()),
  );

  /* ---------- Pagination ---------- */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)));
  readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });
  readonly rangeFrom = computed(() => (this.filteredItems().length ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize, this.filteredItems().length));

  readonly pageTokens = computed<PageToken[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
  });

  async ngOnInit(): Promise<void> {
    try {
      this.items.set(await this.catalogService.getCatalog());
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  onBorrowClick(item: ItemCatalogEntry): void {
    this.cartService.add(item, 1);
    this.router.navigate(['/pinjam']);
  }

  /* ---------- Filter (selalu kembali ke halaman 1) ---------- */
  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onCategory(value: string): void {
    this.categoryFilter.set(value);
    this.currentPage.set(1);
  }

  onStatus(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  onSort(value: string): void {
    this.sortOrder.set(value);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.sortOrder.set('newest');
    this.currentPage.set(1);
  }

  goTo(p: number): void {
    this.currentPage.set(Math.min(Math.max(1, p), this.totalPages()));
  }
}