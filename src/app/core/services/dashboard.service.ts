import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

// ===============================
// INTERFACE
// ===============================

export interface StockPoint {
  label: string;
  value: number;
}

export interface RecentItem {
  id: string | number;
  name: string;
  category: string;
  location: string;
  date: string | Date;
  image?: string;
}

export interface BorrowedItem {
  name: string;
  count: number;
  image?: string;
}

export interface CategoryShare {
  name: string;
  count: number;
}

export interface AdminDashboardStats {
  totalItems: number;
  totalPhysicalStock: number;
  totalAvailableStock: number;
  totalBorrowed: number;
  totalReserved: number;
  totalUnderInspection: number;
  itemsOutOfStock: number;
  totalCategories: number;
  totalIncoming: number;
  totalOutgoing: number;
  pendingRequestsCount: number;

  recentActivity: {
    id: string;
    description: string;
    date: string;
  }[];

  // Data tambahan dashboard
  totalLocations?: number;
  stockTrend?: StockPoint[];
  recentItems?: RecentItem[];
  topBorrowed?: BorrowedItem[];
  categoryBreakdown?: CategoryShare[];
}

// ===============================
// LABEL STATUS PEMINJAMAN
// ===============================

const STATUS_LABELS: Record<string, string> = {
  pending: 'menunggu konfirmasi',
  disetujui: 'disetujui',
  dipinjam: 'dipinjam',
  dikembalikan: 'dikembalikan',
  ditolak: 'ditolak',
  dibatalkan: 'dibatalkan',
};

// ===============================
// DASHBOARD SERVICE
// ===============================

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabaseService = inject(SupabaseService);

  private get client() {
    return this.supabaseService.supabase;
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    // ===============================
    // DATA UTAMA
    // ===============================

    const [
      summaryRes,
      categoriesRes,
      incomingRes,
      outgoingRes,
      pendingRes,
      locationsRes,
    ] = await Promise.all([
      // Ringkasan stok dari database
      this.client.rpc('get_stock_summary'),

      // Total kategori
      this.client
        .from('categories')
        .select('*', { count: 'exact', head: true }),

      // Total barang masuk
      this.client
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'in'),

      // Total barang keluar
      this.client
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'out'),

      // Total pengajuan yang menunggu konfirmasi
      this.client
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Total lokasi
      this.client
        .from('locations')
        .select('*', { count: 'exact', head: true }),
    ]);

    if (summaryRes.error) {
      throw summaryRes.error;
    }

    const summary = (summaryRes.data as any[])?.[0];

    if (!summary) {
      throw new Error('Data ringkasan stok tidak ditemukan.');
    }

    // ===============================
    // AKTIVITAS TERBARU
    // ===============================

    const [recentMovements, recentLoans] = await Promise.all([
      this.client
        .from('stock_movements')
        .select('id, type, quantity, created_at, item_name')
        .order('created_at', { ascending: false })
        .limit(5),

      this.client
        .from('loans')
        .select('id, status, borrower_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (recentMovements.error) {
      throw recentMovements.error;
    }

    if (recentLoans.error) {
      throw recentLoans.error;
    }

    const activity = [
      ...(recentMovements.data ?? []).map((m: any) => ({
        id: `movement-${m.id}`,
        description: `${
          m.type === 'in' ? 'Barang masuk' : 'Barang keluar'
        }: ${m.item_name ?? '-'} (${m.quantity})`,
        date: m.created_at as string,
      })),

      ...(recentLoans.data ?? []).map((l: any) => ({
        id: `loan-${l.id}`,
        description: `Pengajuan oleh ${
          l.borrower_name ?? '-'
        } — ${STATUS_LABELS[l.status] ?? l.status}`,
        date: l.created_at as string,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5);

    // ===============================
    // BARANG TERBARU
    // ===============================

    const recentItemsRes = await this.client
      .from('items')
      .select('id, name, created_at, photo_url, category:categories(name), location:locations(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentItemsRes.error) {
      throw recentItemsRes.error;
    }

    const recentItems: RecentItem[] = (recentItemsRes.data ?? []).map(
      (item: any) => ({
        id: item.id,
        name: item.name ?? '-',
        category: item.category?.name ?? '-',
        location: item.location?.name ?? '-',
        date: item.created_at,
        image: item.photo_url ?? undefined,
      })
    );

    // ===============================
    // BARANG PALING SERING DIPINJAM
    // ===============================

    const loansRes = await this.client
      .from('loan_details')
      .select('item_name, quantity, loans!inner(status)')
      .in('loans.status', ['dipinjam', 'dikembalikan', 'terlambat']);

    if (loansRes.error) {
      throw loansRes.error;
    }

    const borrowedMap = new Map<string, number>();

    for (const loan of loansRes.data ?? []) {
      const name = loan.item_name ?? 'Barang tidak diketahui';
      const count = Number(loan.quantity ?? 1);

      borrowedMap.set(
        name,
        (borrowedMap.get(name) ?? 0) + count
      );
    }

    const topBorrowed: BorrowedItem[] = Array.from(
      borrowedMap.entries()
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ===============================
    // DISTRIBUSI KATEGORI
    // ===============================

    const categoryItemsRes = await this.client
      .from('items')
      .select('category_id');

    if (categoryItemsRes.error) {
      throw categoryItemsRes.error;
    }

    const categoryMap = new Map<string, number>();

    for (const item of categoryItemsRes.data ?? []) {
      const category = item.category_id ?? 'Tanpa kategori';

      categoryMap.set(
        category,
        (categoryMap.get(category) ?? 0) + 1
      );
    }

    const categoryBreakdown: CategoryShare[] = Array.from(
      categoryMap.entries()
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ===============================
    // GRAFIK TREN STOK
    // ===============================

    const totalPhysicalStock = Number(summary.total_physical_stock ?? 0);

    const stockTrend: StockPoint[] = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ].map((label) => ({
      label,
      value: totalPhysicalStock,
    }));

    // ===============================
    // RETURN DATA
    // ===============================

    return {
      totalItems: Number(summary.total_items ?? 0),
      totalPhysicalStock,
      totalAvailableStock: Number(summary.total_available ?? 0),
      totalBorrowed: Number(summary.total_borrowed ?? 0),
      totalReserved: Number(summary.total_reserved ?? 0),
      totalUnderInspection: Number(summary.total_under_inspection ?? 0),
      itemsOutOfStock: Number(summary.items_out_of_stock ?? 0),

      totalCategories: categoriesRes.count ?? 0,
      totalIncoming: incomingRes.count ?? 0,
      totalOutgoing: outgoingRes.count ?? 0,
      pendingRequestsCount: pendingRes.count ?? 0,

      recentActivity: activity,

      totalLocations: locationsRes.count ?? 0,
      stockTrend,
      recentItems,
      topBorrowed,
      categoryBreakdown,
    };
  }
}
