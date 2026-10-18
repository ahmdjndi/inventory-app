import { TestBed } from '@angular/core/testing';
import { StockReportService } from './stock-report.service';
import { SupabaseService } from './supabase.service';

describe('StockReportService', () => {
  it('getReport() memanggil RPC get_stock_report tanpa parameter', async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase: { rpc: rpcSpy } } }],
    });
    const service = TestBed.inject(StockReportService);

    await service.getReport();
    expect(rpcSpy).toHaveBeenCalledWith('get_stock_report');
  });
});