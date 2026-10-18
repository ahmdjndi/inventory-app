import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Item, ItemWithRelations } from '../models/item.model';

export interface ItemFormValue {
  code: string;
  name: string;
  category_id: string | null;
  location_id: string | null;
  stock: number;
  unit: string;
  condition: string;
  description: string | null;
  photo_url: string | null;
  purchase_date: string | null;
  price: number | null;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly supabaseService = inject(SupabaseService);
  private get client() {
    return this.supabaseService.supabase;
  }

  async list(): Promise<ItemWithRelations[]> {
    const { data, error } = await this.client
      .from('items')
      .select('*, category:categories(name), location:locations(name)')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      category_name: row.category?.name ?? null,
      location_name: row.location?.name ?? null,
    }));
  }

  async getById(id: string): Promise<ItemWithRelations | null> {
    const { data, error } = await this.client
      .from('items')
      .select('*, category:categories(name), location:locations(name)')
      .eq('id', id)
      .single();
    if (error) return null;
    return {
      ...data,
      category_name: data.category?.name ?? null,
      location_name: data.location?.name ?? null,
    };
  }

  async create(value: ItemFormValue): Promise<Item> {
    const { data, error } = await this.client.from('items').insert(value).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, value: ItemFormValue): Promise<Item> {
    const { data, error } = await this.client
      .from('items')
      .update(value)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('items').delete().eq('id', id);
    if (error) throw error;
  }

  async isCodeTaken(code: string, excludeId?: string): Promise<boolean> {
    let query = this.client.from('items').select('id').eq('code', code);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).length > 0;
  }

  async listNeedingInspection(): Promise<ItemWithRelations[]> {
  const { data, error } = await this.client
    .from('items')
    .select('*, category:categories(name), location:locations(name)')
    .gt('quantity_under_inspection', 0)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    category_name: row.category?.name ?? null,
    location_name: row.location?.name ?? null,
  }));
}

async resolveInspection(
  itemId: string,
  quantity: number,
  action: 'kembalikan' | 'writeoff',
  notes: string | null
): Promise<void> {
  const { error } = await this.client.rpc('resolve_item_inspection', {
    p_item_id: itemId,
    p_quantity: quantity,
    p_action: action,
    p_notes: notes,
  });
  if (error) throw error;
}
}