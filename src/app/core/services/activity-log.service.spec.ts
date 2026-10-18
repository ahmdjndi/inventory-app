import { TestBed } from '@angular/core/testing';
import { ActivityLogService } from './activity-log.service';
import { SupabaseService } from './supabase.service';

describe('ActivityLogService', () => {
  it('getLog() memanggil RPC get_activity_log dengan rentang tanggal yang benar', async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase: { rpc: rpcSpy } } }],
    });
    const service = TestBed.inject(ActivityLogService);

    await service.getLog('2026-10-01', '2026-10-31');

    expect(rpcSpy).toHaveBeenCalledWith('get_activity_log', {
      p_date_from: '2026-10-01',
      p_date_to: '2026-10-31',
    });
  });

  it('getLog() melempar error jika RPC gagal', async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: null, error: { message: 'gagal' } });
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase: { rpc: rpcSpy } } }],
    });
    const service = TestBed.inject(ActivityLogService);
    await expect(service.getLog('2026-01-01', '2026-01-31')).rejects.toThrow();
  });
});