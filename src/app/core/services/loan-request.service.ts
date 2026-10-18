import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface LoanRequestPayload {
  borrowerName: string;
  borrowerContact: string;
  borrowerStatus: 'guru' | 'siswa';
  borrowerClass: string;
  nis: string;
  purpose: string;
  plannedBorrowDate: string;
  plannedReturnDate: string;
  items: { item_id: string; quantity: number }[];
}

export interface LoanSubmissionResult {
  loanId: string;
  transactionCode: string;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class LoanRequestService {
  private readonly supabaseService = inject(SupabaseService);

  async submit(payload: LoanRequestPayload): Promise<LoanSubmissionResult> {
    const { data, error } = await this.supabaseService.supabase.rpc('submit_loan_request', {
      p_borrower_name: payload.borrowerName,
      p_borrower_contact: payload.borrowerContact,
      p_borrower_status: payload.borrowerStatus,
      p_borrower_class: payload.borrowerClass,
      p_nis: payload.nis,
      p_purpose: payload.purpose,
      p_planned_borrow_date: payload.plannedBorrowDate,
      p_planned_return_date: payload.plannedReturnDate,
      p_items: payload.items,
    });
    if (error) throw error;
    // Function `returns table(...)` → supabase-js mengembalikan array; ambil baris pertama.
    const row = (data as any[])[0];
    return { loanId: row.loan_id, transactionCode: row.transaction_code, accessToken: row.access_token };
  }
}