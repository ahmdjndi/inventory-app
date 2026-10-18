import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  LoanWithItems,
  LoanStatus,
  LoanStatusHistoryEntry,
} from '../models/loan.model';

// ===============================
// INTERFACE
// ===============================

export interface ProcessReturnPayload {
  quantity: number;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  complete: boolean;
  notes: string | null;
  photoUrl: string | null;
}

export interface LoanQueryOptions {
  statuses: LoanStatus[];
  search?: string;
  page: number;
  pageSize: number;
}

export interface PagedLoans {
  items: LoanWithItems[];
  totalCount: number;
}

// ===============================
// QUERY PEMINJAMAN
// ===============================

const LOAN_SELECT =
  '*, loan_details(id, quantity, returned_quantity, handed_over_quantity, item_name, item_code)';

// ===============================
// LOAN SERVICE
// ===============================

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly supabaseService = inject(SupabaseService);

  private get client() {
    return this.supabaseService.supabase;
  }

  // ===============================
  // SELURUH RIWAYAT PEMINJAMAN
  // ===============================

  async list(): Promise<LoanWithItems[]> {
    const { data, error } = await this.client
      .from('loans')
      .select(LOAN_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return this.mapRows(data ?? []);
  }

  // ===============================
  // FILTER PEMINJAMAN BERDASARKAN STATUS
  // Tetap dipertahankan untuk kompatibilitas
  // dengan kode lama.
  // ===============================

  async listPending(): Promise<LoanWithItems[]> {
    return this.queryByStatus('pending');
  }

  async listReserved(): Promise<LoanWithItems[]> {
    return this.queryByStatus('disetujui');
  }

  async listActive(): Promise<LoanWithItems[]> {
    return this.queryByStatus('dipinjam');
  }

  private async queryByStatus(
    status: LoanStatus
  ): Promise<LoanWithItems[]> {
    const { data, error } = await this.client
      .from('loans')
      .select(LOAN_SELECT)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return this.mapRows(data ?? []);
  }

  // ===============================
  // PEMINJAMAN DENGAN PAGINATION
  // Pencarian dan filter beberapa status
  // ===============================

  async queryPaged(
    options: LoanQueryOptions
  ): Promise<PagedLoans> {
    const { statuses, search, page, pageSize } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = this.client
      .from('loans')
      .select(LOAN_SELECT, { count: 'exact' })
      .in('status', statuses)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search?.trim()) {
      const term = `%${search.trim()}%`;

      request = request.or(
        `borrower_name.ilike.${term},nis.ilike.${term},transaction_code.ilike.${term}`
      );
    }

    const { data, error, count } = await request;

    if (error) throw error;

    return {
      items: this.mapRows(data ?? []),
      totalCount: count ?? 0,
    };
  }

  // ===============================
  // RIWAYAT PERUBAHAN STATUS
  // ===============================

  async getStatusHistory(
    loanId: string
  ): Promise<LoanStatusHistoryEntry[]> {
    const { data, error } = await this.client
      .from('loan_status_history')
      .select(
        'id, from_status, to_status, changed_at, notes, profiles(full_name)'
      )
      .eq('loan_id', loanId)
      .order('changed_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      from_status: row.from_status,
      to_status: row.to_status,
      changed_by_name: row.profiles?.full_name ?? null,
      changed_at: row.changed_at,
      notes: row.notes,
    }));
  }

  // ===============================
  // PEMETAAN DATA PEMINJAMAN
  // ===============================

  private mapRows(rows: any[]): LoanWithItems[] {
    return rows.map((row) => ({
      ...row,
      items: (row.loan_details ?? []).map((d: any) => ({
        id: d.id,
        item_name: d.item_name ?? '(nama tidak tersedia)',
        item_code: d.item_code ?? '-',
        quantity: d.quantity,
        returned_quantity: d.returned_quantity,
        handed_over_quantity: d.handed_over_quantity ?? 0,
      })),
    }));
  }

  // ===============================
  // SETUJUI PEMINJAMAN
  // ===============================

  async approve(
    loanId: string,
    notes?: string
  ): Promise<void> {
    const { error } = await this.client.rpc('approve_loan_request', {
      p_loan_id: loanId,
      p_notes: notes ?? null,
    });

    if (error) throw error;
  }

  // ===============================
  // TOLAK PEMINJAMAN
  // ===============================

  async reject(
    loanId: string,
    reason: string
  ): Promise<void> {
    const { error } = await this.client.rpc('reject_loan_request', {
      p_loan_id: loanId,
      p_reason: reason,
    });

    if (error) throw error;
  }

  // ===============================
  // BATALKAN PEMINJAMAN
  // ===============================

  async cancel(
    loanId: string,
    reason: string
  ): Promise<void> {
    const { error } = await this.client.rpc('cancel_loan_request', {
      p_loan_id: loanId,
      p_reason: reason,
    });

    if (error) throw error;
  }

  // ===============================
  // SERAHKAN BARANG
  // ===============================

  async handoverItem(
    loanDetailId: string,
    quantity: number
  ): Promise<void> {
    const { error } = await this.client.rpc('handover_loan_item', {
      p_loan_detail_id: loanDetailId,
      p_quantity: quantity,
    });

    if (error) throw error;
  }

  // ===============================
  // PROSES PENGEMBALIAN BARANG
  // ===============================

  async processReturn(
    loanDetailId: string,
    payload: ProcessReturnPayload
  ): Promise<void> {
    const { error } = await this.client.rpc('process_loan_return', {
      p_loan_detail_id: loanDetailId,
      p_quantity: payload.quantity,
      p_condition: payload.condition,
      p_complete: payload.complete,
      p_notes: payload.notes,
      p_photo_url: payload.photoUrl,
    });

    if (error) throw error;
  }
}