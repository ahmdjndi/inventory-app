import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StockMovementWithDetails } from '../models/stock-movement.model';

export interface IncomingStockFormValue {
  item_id: string;
  quantity: number;
  transaction_date: string;
  source: string | null;
  notes: string | null;
}

export interface OutgoingStockFormValue {
  item_id: string;
  quantity: number;
  transaction_date: string;
  destination: string | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private readonly supabaseService = inject(SupabaseService);
  private get client() {
    return this.supabaseService.supabase;
  }

  async listIncoming(): Promise<StockMovementWithDetails[]> {
    return this.listByType('in');
  }

  async listOutgoing(): Promise<StockMovementWithDetails[]> {
    return this.listByType('out');
  }

  async listAll(): Promise<StockMovementWithDetails[]> {
    const [incoming, outgoing] = await Promise.all([
      this.listByType('in'),
      this.listByType('out'),
    ]);
    return [...incoming, ...outgoing];
  }

  protected async listByType(type: 'in' | 'out'): Promise<StockMovementWithDetails[]> {
    const { data, error } = await this.client
      .from('stock_movements')
      .select('*, recorder:profiles(full_name)')
      .eq('type', type)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      item_name: row.item_name ?? '(nama tidak tersedia)',
      item_code: row.item_code ?? '-',
      recorder_name: row.recorder?.full_name ?? '-',
    }));
  }

  async recordIncoming(value: IncomingStockFormValue): Promise<string> {
    const { data, error } = await this.client.rpc('record_incoming_stock', {
      p_item_id: value.item_id,
      p_quantity: value.quantity,
      p_transaction_date: value.transaction_date,
      p_source: value.source,
      p_notes: value.notes,
    });
    if (error) throw error;
    return data as string;
  }

  async recordOutgoing(value: OutgoingStockFormValue): Promise<string> {
    const { data, error } = await this.client.rpc('record_outgoing_stock', {
      p_item_id: value.item_id,
      p_quantity: value.quantity,
      p_transaction_date: value.transaction_date,
      p_destination: value.destination,
      p_notes: value.notes,
    });
    if (error) throw error;
    return data as string;
  }
}