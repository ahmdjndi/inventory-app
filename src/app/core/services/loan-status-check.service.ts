import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface LoanStatusItem {
  item_name: string;
  item_code: string;
  quantity: number;
  returned_quantity: number;
}

export interface LoanStatusResult {
  transaction_code: string;
  status: string;
  borrower_name: string;
  borrower_class: string;
  planned_borrow_date: string;
  planned_return_date: string;
  actual_return_date: string | null;
  rejected_reason: string | null;
  cancelled_reason: string | null;
  created_at: string;
  items: LoanStatusItem[];
}

@Injectable({ providedIn: 'root' })
export class LoanStatusCheckService {
  private readonly supabaseService = inject(SupabaseService);

  async check(transactionCode: string, accessToken: string): Promise<LoanStatusResult | null> {
    const { data, error } = await this.supabaseService.supabase.rpc('check_loan_status', {
      p_transaction_code: transactionCode,
      p_access_token: accessToken,
    });
    if (error) throw error;
    const rows = data as any[];
    return rows.length > 0 ? rows[0] : null;
  }
}