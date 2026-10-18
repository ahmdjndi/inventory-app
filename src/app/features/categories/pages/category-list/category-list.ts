import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService, CategoryWithCount } from '../../../../core/services/category.service';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

type PageToken = number | '…';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  private readonly categoryService = inject(CategoryService);

  readonly categories = signal<CategoryWithCount[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly searchTerm = signal('');
  private readonly currentPage = signal(1);
  readonly pageSize = 10;

  /** Dipakai @for skeleton saat memuat — cukup beberapa baris placeholder. */
  readonly skeletonRows = [0, 1, 2, 3];

  /** Ikon SVG (atribut "d"), dipakai ulang di template. */
  readonly icons = {
    plus: 'M12 5v14M5 12h14',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
    reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    trash: 'M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',
    tag: 'M12.6 2H4a2 2 0 00-2 2v8.6a2 2 0 00.6 1.4l8.6 8.6a2 2 0 002.8 0l7.2-7.2a2 2 0 000-2.8L13.4 2.6A2 2 0 0012.6 2z M7.5 7.5h.01',
    box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
    empty: 'M20 7H4a1 1 0 00-1 1v3h18V8a1 1 0 00-1-1z M3 11v8a1 1 0 001 1h16a1 1 0 001-1v-8 M9 15h6',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
  };

  /** Hasil pencarian (nama atau deskripsi). */
  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.categories();
    return this.categories().filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.description ?? '').toLowerCase().includes(term),
    );
  });

  /** 3 kartu statistik (dihitung dari seluruh data, bukan hasil pencarian). */
  readonly summary = computed(() => {
    const all = this.categories();
    return [
      { label: 'Total Kategori', value: all.length, desc: 'Kategori barang inventaris', tone: 'blue', icon: this.icons.tag },
      { label: 'Total Barang', value: all.reduce((sum, c) => sum + c.item_count, 0), desc: 'Barang yang sudah berkategori', tone: 'green', icon: this.icons.box },
      { label: 'Kategori Kosong', value: all.filter((c) => c.item_count === 0).length, desc: 'Belum dipakai barang apa pun', tone: 'amber', icon: this.icons.empty },
    ];
  });

  /* ---------- Pagination ---------- */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  /** Halaman aktif yang aman (tidak melebihi total halaman, misal setelah hapus data). */
  readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedCategories = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });
  readonly rangeFrom = computed(() => (this.filtered().length ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize, this.filtered().length));

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
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async reload(): Promise<void> {
    this.categories.set(await this.categoryService.listWithItemCount());
  }

  async onDelete(category: CategoryWithCount): Promise<void> {
    const message =
      category.item_count > 0
        ? `Kategori ini dipakai oleh ${category.item_count} barang. Barang tersebut akan kehilangan kategorinya (tidak ikut terhapus). Lanjutkan hapus?`
        : 'Hapus kategori ini?';
    if (!confirm(message)) return;

    this.errorMessage.set(null);
    try {
      await this.categoryService.delete(category.id);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
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

  /* ---------- Tampilan ---------- */
  /** Warna ikon kategori: berdasarkan urutan di seluruh daftar, sama dengan badge di Daftar Barang. */
  tone(category: CategoryWithCount): string {
    const idx = this.categories().findIndex((c) => c.id === category.id);
    return 'cat-' + (idx < 0 ? 0 : idx % 6);
  }
}