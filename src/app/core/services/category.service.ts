import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Category } from '../models/category.model';

export interface CategoryFormValue {
  name: string;
  description: string | null;
}

export interface CategoryWithCount extends Category {
  item_count: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly supabaseService = inject(SupabaseService);
  private get client() {
    return this.supabaseService.supabase;
  }

  /** Untuk dropdown di form Barang (dipakai sejak Fase 14). */
  async list(): Promise<Category[]> {
    const { data, error } = await this.client.from('categories').select('*').order('name');
    if (error) throw error;
    return data ?? [];
  }

  /** Untuk halaman daftar Kategori — menyertakan jumlah barang per kategori. */
  async listWithItemCount(): Promise<CategoryWithCount[]> {
    const [{ data: categories, error: catError }, { data: items, error: itemError }] =
      await Promise.all([
        this.client.from('categories').select('*').order('name'),
        this.client.from('items').select('category_id'),
      ]);
    if (catError) throw catError;
    if (itemError) throw itemError;

    const counts = new Map<string, number>();
    for (const row of items ?? []) {
      if (row.category_id) {
        counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
      }
    }

    return (categories ?? []).map((c) => ({ ...c, item_count: counts.get(c.id) ?? 0 }));
  }

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await this.client.from('categories').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async create(value: CategoryFormValue): Promise<Category> {
    const { data, error } = await this.client.from('categories').insert(value).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, value: CategoryFormValue): Promise<Category> {
    const { data, error } = await this.client
      .from('categories')
      .update(value)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async isNameTaken(name: string, excludeId?: string): Promise<boolean> {
    let query = this.client.from('categories').select('id').eq('name', name);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).length > 0;
  }
}