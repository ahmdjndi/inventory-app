import { TestBed } from '@angular/core/testing';
import { LoanService } from './loan.service';
import { SupabaseService } from './supabase.service';

/** Mock query builder Supabase — chainable DAN awaitable, meniru perilaku supabase-js sungguhan. */
function createQueryBuilderMock(result: { data: any; error: any; count?: number }) {
  const builder: any = {};
  builder.select = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.range = vi.fn(() => builder);
  builder.then = (resolve: any) => resolve(result);
  return builder;
}

describe('LoanService', () => {
  let service: LoanService;
  let rpcSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpcSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase: { rpc: rpcSpy } } }],
    });
    service = TestBed.inject(LoanService);
  });

  // --- Tahap 4 ---
  it('approve() memanggil RPC approve_loan_request dengan loan id yang benar', async () => {
    await service.approve('loan-1', 'catatan');
    expect(rpcSpy).toHaveBeenCalledWith('approve_loan_request', { p_loan_id: 'loan-1', p_notes: 'catatan' });
  });

  it('reject() memanggil RPC reject_loan_request dengan alasan', async () => {
    await service.reject('loan-2', 'Barang tidak tersedia');
    expect(rpcSpy).toHaveBeenCalledWith('reject_loan_request', { p_loan_id: 'loan-2', p_reason: 'Barang tidak tersedia' });
  });

  it('cancel() memanggil RPC cancel_loan_request dengan alasan', async () => {
    await service.cancel('loan-3', 'Siswa membatalkan');
    expect(rpcSpy).toHaveBeenCalledWith('cancel_loan_request', { p_loan_id: 'loan-3', p_reason: 'Siswa membatalkan' });
  });

  it('approve() melempar error jika RPC menolak (mis. stok tidak cukup)', async () => {
    rpcSpy.mockResolvedValueOnce({ data: null, error: { message: 'Stok tidak mencukupi' } });
    await expect(service.approve('loan-4')).rejects.toThrow();
  });

  // --- Tahap 5 ---
  it('handoverItem() memanggil RPC handover_loan_item dengan id & jumlah yang benar', async () => {
    await service.handoverItem('detail-1', 3);
    expect(rpcSpy).toHaveBeenCalledWith('handover_loan_item', { p_loan_detail_id: 'detail-1', p_quantity: 3 });
  });

  it('handoverItem() melempar error jika RPC menolak', async () => {
    rpcSpy.mockResolvedValueOnce({ data: null, error: { message: 'Sudah diserahkan sepenuhnya' } });
    await expect(service.handoverItem('detail-2', 1)).rejects.toThrow();
  });

  // --- Tahap 6 ---
  it('processReturn() mengirim kondisi, kelengkapan, catatan, dan foto ke RPC', async () => {
    await service.processReturn('detail-1', {
      quantity: 2, condition: 'rusak_ringan', complete: false,
      notes: 'Tombol power longgar', photoUrl: 'https://example.com/foto.jpg',
    });
    expect(rpcSpy).toHaveBeenCalledWith('process_loan_return', {
      p_loan_detail_id: 'detail-1', p_quantity: 2, p_condition: 'rusak_ringan',
      p_complete: false, p_notes: 'Tombol power longgar', p_photo_url: 'https://example.com/foto.jpg',
    });
  });

  it('processReturn() melempar error jika jumlah melebihi sisa', async () => {
    rpcSpy.mockResolvedValueOnce({ data: null, error: { message: 'Jumlah melebihi sisa' } });
    await expect(
      service.processReturn('detail-2', { quantity: 5, condition: 'baik', complete: true, notes: null, photoUrl: null })
    ).rejects.toThrow();
  });

  // --- Tahap 8 ---
  describe('queryPaged()', () => {
    it('membangun query dengan filter status, pencarian, dan range yang benar', async () => {
      const builder = createQueryBuilderMock({ data: [], error: null, count: 0 });
      const fromSpy = vi.fn(() => builder);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: SupabaseService, useValue: { supabase: { from: fromSpy } } }],
      });
      const localService = TestBed.inject(LoanService);

      await localService.queryPaged({ statuses: ['pending'], search: 'budi', page: 2, pageSize: 10 });

      expect(fromSpy).toHaveBeenCalledWith('loans');
      expect(builder.in).toHaveBeenCalledWith('status', ['pending']);
      expect(builder.range).toHaveBeenCalledWith(10, 19); // halaman 2, pageSize 10
      expect(builder.or).toHaveBeenCalled();
    });

    it('mengembalikan totalCount dari hasil query, bukan jumlah baris di halaman saat ini', async () => {
      const builder = createQueryBuilderMock({ data: [{ id: 'a' }], error: null, count: 47 });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: SupabaseService, useValue: { supabase: { from: vi.fn(() => builder) } } }],
      });
      const localService = TestBed.inject(LoanService);

      const result = await localService.queryPaged({ statuses: ['dipinjam'], page: 1, pageSize: 10 });
      expect(result.totalCount).toBe(47);
    });
  });

  describe('getStatusHistory()', () => {
    it('memetakan profiles.full_name menjadi changed_by_name', async () => {
      const builder = createQueryBuilderMock({
        data: [
          { id: 'h1', from_status: 'pending', to_status: 'disetujui', changed_at: '2026-01-01', notes: null, profiles: { full_name: 'Bu Guru' } },
        ],
        error: null,
      });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: SupabaseService, useValue: { supabase: { from: vi.fn(() => builder) } } }],
      });
      const localService = TestBed.inject(LoanService);

      const result = await localService.getStatusHistory('loan-x');
      expect(builder.eq).toHaveBeenCalledWith('loan_id', 'loan-x');
      expect(result[0].changed_by_name).toBe('Bu Guru');
    });
  });
});