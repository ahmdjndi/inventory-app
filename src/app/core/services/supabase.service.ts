import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        persistSession: true,   // simpan sesi di localStorage browser, bertahan lintas restart/tutup browser
        autoRefreshToken: true, // perbarui token secara diam-diam sebelum kedaluwarsa, selama app terbuka
      },
    }
  );

  get supabase(): SupabaseClient {
    return this.client;
  }
}