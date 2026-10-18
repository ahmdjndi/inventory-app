import { TestBed } from '@angular/core/testing';
import { ItemService } from './item.service';
import { SupabaseService } from './supabase.service';

describe('ItemService — resolveInspection', () => {
  let service: ItemService;
  let rpcSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpcSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { supabase: { rpc: rpcSpy } } }],
    });
    service = TestBed.inject(ItemService);
  });

  it('resolveInspection() memanggil RPC dengan parameter yang benar untuk aksi "kembalikan"', async () => {
    await service.resolveInspection('item-1', 2, 'kembalikan', null);
    expect(rpcSpy).toHaveBeenCalledWith('resolve_item_inspection', {
      p_item_id: 'item-1',
      p_quantity: 2,
      p_action: 'kembalikan',
      p_notes: null,
    });
  });

  it('resolveInspection() melempar error jika jumlah melebihi yang sedang diperiksa', async () => {
    rpcSpy.mockResolvedValueOnce({
      data: null,
      error: { message: 'Jumlah melebihi yang sedang diperiksa (sedang diperiksa: 1)' },
    });
    await expect(service.resolveInspection('item-2', 5, 'writeoff', 'rusak berat')).rejects.toThrow();
  });
});