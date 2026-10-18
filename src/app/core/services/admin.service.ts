import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile, StaffRole } from '../models/profile.model';

export interface AdminUpdate {
  full_name: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly supabaseService = inject(SupabaseService);

  private get client() {
    return this.supabaseService.supabase;
  }

  async list(): Promise<Profile[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) throw error;

    return data ?? [];
  }

  async update(id: string, value: AdminUpdate): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async setRole(id: string, role: StaffRole): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Menghapus baris profil — BUKAN menghapus akun login (auth.users).
   *
   * Efeknya: akun tersebut tidak lagi memiliki profil,
   * sehingga AuthService tidak menemukan data dirinya setelah login
   * dan authGuard menolaknya.
   */
  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}