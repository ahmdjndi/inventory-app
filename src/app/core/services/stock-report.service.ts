import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StockReportEntry } from '../models/stock-report.model';

@Injectable({ providedIn: 'root' })
export class StockReportService {
  private readonly supabaseService = inject(SupabaseService);

  async getReport(): Promise<StockReportEntry[]> {
    const { data, error } = await this.supabaseService.supabase.rpc('get_stock_report');
    if (error) throw error;
    return (data ?? []) as StockReportEntry[];
  }
}