import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { LoanService } from '../../../../core/services/loan.service';
import { ItemService } from '../../../../core/services/item.service';
import { StorageService } from '../../../../core/services/storage.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  LoanWithItems, LoanItemDetail, LoanStatus, ReturnCondition, LoanStatusHistoryEntry,
} from '../../../../core/models/loan.model';
import { ItemWithRelations } from '../../../../core/models/item.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

type TabId = 'pengajuan' | 'disetujui' | 'dipinjam' | 'perlu-diperiksa' | 'selesai' | 'ditolak-dibatalkan';
type PageToken = number | '…';

interface TabConfig {
  id: TabId;
  label: string;
  statuses?: LoanStatus[];
}

const TABS: TabConfig[] = [
  { id: 'pengajuan', label: 'Pengajuan', statuses: ['pending'] },
  { id: 'disetujui', label: 'Disetujui / Siap Diserahkan', statuses: ['disetujui'] },
  { id: 'dipinjam', label: 'Sedang Dipinjam', statuses: ['dipinjam'] },
  { id: 'perlu-diperiksa', label: 'Perlu Diperiksa' },
  { id: 'selesai', label: 'Selesai', statuses: ['dikembalikan'] },
  { id: 'ditolak-dibatalkan', label: 'Ditolak / Dibatalkan', statuses: ['ditolak', 'dibatalkan'] },
];

/** Nama kelas warna per status (lihat CSS: .s-pending, .s-approved, dst). */
const STATUS_TONE: Record<string, string> = {
  pending: 's-pending',
  disetujui: 's-approved',
  dipinjam: 's-active',
  dikembalikan: 's-done',
  ditolak: 's-rejected',
  dibatalkan: 's-cancel',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  disetujui: 'Disetujui',
  dipinjam: 'Dipinjam',
  dikembalikan: 'Selesai',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

/** Ikon SVG (isi atribut "d" milik <path>), dipakai ulang di template. */
/** Ikon SVG (isi atribut "d" milik <path>), dipakai ulang di template. */
const ICONS = {
  clipboard: 'M9 3h6v3H9z M8 4.5H6a2 2 0 00-2 2V20a1 1 0 001 1h14a1 1 0 001-1V6.5a2 2 0 00-2-2h-2 M9 13l2 2 4-4',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
  reset: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8 M3 3v5h5',
  check: 'M5 12l5 5L20 7',
  alert: 'M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z',
  wrench: 'M14.7 6.3a4 4 0 005 5L21 13l-8 8a2.8 2.8 0 01-4-4l8-8z M14.7 6.3L11 10',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z M12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  chevron: 'M6 9l6 6 6-6',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  inbox: 'M3 13h5l1 3h6l1-3h5 M5 5h14l2 8v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6l2-8z',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
} as const;

interface ReturnFormState {
  quantity: number;
  condition: ReturnCondition;
  complete: boolean;
  notes: string;
  photoUrl: string | null;
  isUploadingPhoto: boolean;
}

const PAGE_SIZE = 10;

/** Nomor halaman: 1 2 3 4 5 … 26 */
function buildPageTokens(cur: number, total: number): PageToken[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', cur - 1, cur, cur + 1, '…', total];
}

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet],
  templateUrl: './loan-list.html',
  styleUrl: './loan-list.css',
})
export class LoanList implements OnInit, OnDestroy {
  private readonly loanService = inject(LoanService);
  private readonly itemService = inject(ItemService);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);

  readonly icons = ICONS;
  readonly skeletonSlots = [1, 2, 3];

  readonly tabs = TABS;
  readonly activeTab = signal<TabId>('pengajuan');
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly loans = signal<LoanWithItems[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));
  readonly pageTokens = computed(() => buildPageTokens(this.page(), this.totalPages()));
  readonly rangeFrom = computed(() => (this.totalCount() ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize, this.totalCount()));

  readonly itemsNeedingInspection = signal<ItemWithRelations[]>([]);
  readonly filteredInspectionItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.itemsNeedingInspection();
    return this.itemsNeedingInspection().filter(
      (i) => i.name.toLowerCase().includes(term) || i.code.toLowerCase().includes(term)
    );
  });

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly processingId = signal<string | null>(null);
  readonly isAdmin = computed(() => this.authService.isAdmin);

  readonly expandedLoanId = signal<string | null>(null);
  readonly statusHistory = signal<Record<string, LoanStatusHistoryEntry[]>>({});
  readonly isLoadingHistory = signal(false);

  readonly verifiedLoanIds = signal<Set<string>>(new Set());
  private readonly handoverQuantities: Record<string, number> = {};
  private readonly returnForms: Record<string, ReturnFormState> = {};
  private readonly inspectionResolveQty: Record<string, number> = {};

  /** Pewaktu jeda pencarian (debounce), supaya query tidak dikirim di setiap huruf. */
  private searchTimer?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  statusLabel(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }
  statusBadgeClass(status: string): string {
    return STATUS_TONE[status] ?? 's-cancel';
  }

  async setTab(tab: TabId): Promise<void> {
    if (this.activeTab() === tab) return;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.activeTab.set(tab);
    this.page.set(1);
    this.searchTerm.set('');
    this.expandedLoanId.set(null);
    await this.reload();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    // Tab 'perlu-diperiksa' memfilter secara client-side (computed) — tidak query ulang.
    if (this.currentTabConfig().statuses) {
      this.searchTimer = setTimeout(() => void this.reload(), 300);
    }
  }

  async resetSearch(): Promise<void> {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTerm.set('');
    this.page.set(1);
    if (this.currentTabConfig().statuses) await this.reload();
  }

  async goToPage(p: number): Promise<void> {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    await this.reload();
  }

  /** Muat ulang data tab yang sedang aktif. */
  async retry(): Promise<void> {
    await this.reload();
  }

  private currentTabConfig(): TabConfig {
    return this.tabs.find((t) => t.id === this.activeTab())!;
  }

  private async reload(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const tab = this.currentTabConfig();
      if (tab.id === 'perlu-diperiksa') {
        this.itemsNeedingInspection.set(await this.itemService.listNeedingInspection());
        this.loans.set([]);
        this.totalCount.set(0);
      } else {
        const result = await this.loanService.queryPaged({
          statuses: tab.statuses!,
          search: this.searchTerm(),
          page: this.page(),
          pageSize: this.pageSize,
        });
        this.loans.set(result.items);
        this.totalCount.set(result.totalCount);
      }
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleDetail(loan: LoanWithItems): Promise<void> {
    if (this.expandedLoanId() === loan.id) {
      this.expandedLoanId.set(null);
      return;
    }
    this.expandedLoanId.set(loan.id);
    if (!this.statusHistory()[loan.id]) {
      this.isLoadingHistory.set(true);
      try {
        const history = await this.loanService.getStatusHistory(loan.id);
        this.statusHistory.update((map) => ({ ...map, [loan.id]: history }));
      } catch (err) {
        this.errorMessage.set(parseSupabaseError(err));
      } finally {
        this.isLoadingHistory.set(false);
      }
    }
  }

  // --- Pengajuan ---
  async onApprove(loan: LoanWithItems): Promise<void> {
    if (!confirm(`Setujui pengajuan dari "${loan.borrower_name}"? Stok akan dicadangkan.`)) return;
    this.processingId.set(loan.id);
    this.errorMessage.set(null);
    try {
      await this.loanService.approve(loan.id);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.processingId.set(null);
    }
  }

  async onReject(loan: LoanWithItems): Promise<void> {
    const reason = prompt(`Alasan menolak pengajuan "${loan.borrower_name}":`);
    if (!reason || !reason.trim()) return;
    this.processingId.set(loan.id);
    this.errorMessage.set(null);
    try {
      await this.loanService.reject(loan.id, reason.trim());
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.processingId.set(null);
    }
  }

  // --- Disetujui / Siap Diserahkan ---
  async onCancelReservation(loan: LoanWithItems): Promise<void> {
    const reason = prompt(`Alasan membatalkan reservasi "${loan.borrower_name}":`);
    if (!reason || !reason.trim()) return;
    this.processingId.set(loan.id);
    this.errorMessage.set(null);
    try {
      await this.loanService.cancel(loan.id, reason.trim());
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.processingId.set(null);
    }
  }

  isVerified(loanId: string): boolean {
    return this.verifiedLoanIds().has(loanId);
  }
  toggleVerified(loanId: string): void {
    const next = new Set(this.verifiedLoanIds());
    next.has(loanId) ? next.delete(loanId) : next.add(loanId);
    this.verifiedLoanIds.set(next);
  }

  remainingToHandover(item: LoanItemDetail): number {
    return item.quantity - (item.handed_over_quantity ?? 0);
  }
  getHandoverQuantity(itemId: string, max: number): number {
    return this.handoverQuantities[itemId] ?? max;
  }
  setHandoverQuantity(itemId: string, value: string): void {
    this.handoverQuantities[itemId] = Number(value);
  }
  async onHandover(loanDetailId: string, max: number): Promise<void> {
    const quantity = this.getHandoverQuantity(loanDetailId, max);
    this.processingId.set(loanDetailId);
    this.errorMessage.set(null);
    try {
      await this.loanService.handoverItem(loanDetailId, quantity);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.processingId.set(null);
    }
  }

  // --- Sedang Dipinjam ---
  isOverdue(loan: LoanWithItems): boolean {
    return (
      loan.status === 'dipinjam' &&
      new Date(loan.planned_return_date) < new Date(new Date().toDateString())
    );
  }

  remaining(item: LoanItemDetail): number {
    return item.quantity - item.returned_quantity;
  }

  itemsSummary(loan: LoanWithItems): string {
  return loan.items.map((it) => `${it.item_name} x${it.quantity}`).join(', ');
}

  /** Persentase barang yang sudah dikembalikan (untuk bar progres). */
  returnedPercent(item: LoanItemDetail): number {
    return item.quantity > 0 ? Math.min(100, Math.round((item.returned_quantity / item.quantity) * 100)) : 0;
  }

  /** Persentase barang yang sudah diserahkan (untuk bar progres). */
  handedOverPercent(item: LoanItemDetail): number {
    return item.quantity > 0
      ? Math.min(100, Math.round(((item.handed_over_quantity ?? 0) / item.quantity) * 100))
      : 0;
  }

  getReturnForm(itemId: string, max: number): ReturnFormState {
    if (!this.returnForms[itemId]) {
      this.returnForms[itemId] = {
        quantity: max, condition: 'baik', complete: true, notes: '', photoUrl: null, isUploadingPhoto: false,
      };
    }
    return this.returnForms[itemId];
  }
  setReturnQuantity(itemId: string, max: number, value: string): void {
    this.getReturnForm(itemId, max).quantity = Number(value);
  }
  setReturnCondition(itemId: string, max: number, value: string): void {
    this.getReturnForm(itemId, max).condition = value as ReturnCondition;
  }
  setReturnComplete(itemId: string, max: number, value: boolean): void {
    this.getReturnForm(itemId, max).complete = value;
  }
  setReturnNotes(itemId: string, max: number, value: string): void {
    this.getReturnForm(itemId, max).notes = value;
  }

  async onReturnPhotoSelected(itemId: string, max: number, event: Event): Promise<void> {
    const form = this.getReturnForm(itemId, max);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('File bukti foto harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set('Ukuran foto maksimal 2MB.');
      return;
    }
    form.isUploadingPhoto = true;
    this.errorMessage.set(null);
    try {
      form.photoUrl = await this.storageService.uploadItemPhoto(file);
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      form.isUploadingPhoto = false;
    }
  }

  async onProcessReturn(loanDetailId: string, max: number): Promise<void> {
    const form = this.getReturnForm(loanDetailId, max);
    this.processingId.set(loanDetailId);
    this.errorMessage.set(null);
    try {
      await this.loanService.processReturn(loanDetailId, {
        quantity: form.quantity, condition: form.condition, complete: form.complete,
        notes: form.notes.trim() || null, photoUrl: form.photoUrl,
      });
      delete this.returnForms[loanDetailId];
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.processingId.set(null);
    }
  }

  // --- Perlu Diperiksa ---
  getResolveQty(itemId: string, max: number): number {
    return this.inspectionResolveQty[itemId] ?? max;
  }
  setResolveQty(itemId: string, value: string): void {
    this.inspectionResolveQty[itemId] = Number(value);
  }

  async onResolveInspection(item: ItemWithRelations, action: 'kembalikan' | 'writeoff'): Promise<void> {
    const max = item.quantity_under_inspection ?? 0;
    const qty = this.getResolveQty(item.id, max);
    const notes = action === 'writeoff' ? prompt(`Catatan tulis-hapus untuk "${item.name}":`) ?? '' : '';
    if (action === 'writeoff' && !notes.trim()) return;

    this.processingId.set(item.id);
    this.errorMessage.set(null);
    try {
      await this.itemService.resolveInspection(item.id, qty, action, notes.trim() || null);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.processingId.set(null);
    }
  }
}