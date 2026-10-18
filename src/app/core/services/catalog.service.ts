import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ItemCatalogEntry } from '../models/item-catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly supabaseService = inject(SupabaseService);

  /** Dipanggil dari halaman publik (tanpa login) lewat RPC get_items_catalog(). */
  async getCatalog(): Promise<ItemCatalogEntry[]> {
    const { data, error } = await this.supabaseService.supabase.rpc('get_items_catalog');
    if (error) throw error;
    return (data ?? []) as ItemCatalogEntry[];
  }

  async getById(id: string): Promise<ItemCatalogEntry | null> {
    const catalog = await this.getCatalog();
    return catalog.find((item) => item.id === id) ?? null;
  }
}