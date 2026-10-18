import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ActivityLogEntry } from '../models/activity-log.model';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private readonly supabaseService = inject(SupabaseService);

  async getLog(dateFrom: string, dateTo: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await this.supabaseService.supabase.rpc('get_activity_log', {
      p_date_from: dateFrom,
      p_date_to: dateTo,
    });
    if (error) throw error;
    return (data ?? []) as ActivityLogEntry[];
  }
}