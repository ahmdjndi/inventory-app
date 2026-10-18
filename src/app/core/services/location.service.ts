import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StorageLocation } from '../models/location.model';

export interface LocationFormValue {
  name: string;
  description: string | null;
}

export interface LocationWithCount extends StorageLocation {
  item_count: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly supabaseService = inject(SupabaseService);
  private get client() {
    return this.supabaseService.supabase;
  }

  /** Untuk dropdown di form Barang (dipakai sejak Fase 14). */
  async list(): Promise<StorageLocation[]> {
    const { data, error } = await this.client.from('locations').select('*').order('name');
    if (error) throw error;
    return data ?? [];
  }

  /** Untuk halaman daftar Lokasi — menyertakan jumlah barang per lokasi. */
  async listWithItemCount(): Promise<LocationWithCount[]> {
    const [{ data: locations, error: locError }, { data: items, error: itemError }] =
      await Promise.all([
        this.client.from('locations').select('*').order('name'),
        this.client.from('items').select('location_id'),
      ]);
    if (locError) throw locError;
    if (itemError) throw itemError;

    const counts = new Map<string, number>();
    for (const row of items ?? []) {
      if (row.location_id) {
        counts.set(row.location_id, (counts.get(row.location_id) ?? 0) + 1);
      }
    }

    return (locations ?? []).map((l) => ({ ...l, item_count: counts.get(l.id) ?? 0 }));
  }

  async getById(id: string): Promise<StorageLocation | null> {
    const { data, error } = await this.client.from('locations').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async create(value: LocationFormValue): Promise<StorageLocation> {
    const { data, error } = await this.client.from('locations').insert(value).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, value: LocationFormValue): Promise<StorageLocation> {
    const { data, error } = await this.client
      .from('locations')
      .update(value)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('locations').delete().eq('id', id);
    if (error) throw error;
  }

  async isNameTaken(name: string, excludeId?: string): Promise<boolean> {
    let query = this.client.from('locations').select('id').eq('name', name);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).length > 0;
  }
}