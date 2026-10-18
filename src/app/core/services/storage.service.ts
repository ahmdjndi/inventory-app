import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

const ITEM_PHOTOS_BUCKET = 'item-photos';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly supabaseService = inject(SupabaseService);
  private get client() {
    return this.supabaseService.supabase;
  }

  async uploadItemPhoto(file: File): Promise<string> {
    const extension = file.name.split('.').pop() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error } = await this.client.storage
      .from(ITEM_PHOTOS_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;

    const { data } = this.client.storage.from(ITEM_PHOTOS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}