import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ItemService } from '../../../../core/services/item.service';
import { StockMovementService } from '../../../../core/services/stock-movement.service';
import { ItemWithRelations } from '../../../../core/models/item.model';

@Component({
  selector: 'app-outgoing-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './outgoing-create.html',
})
export class OutgoingCreate implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly router = inject(Router);

  readonly items = signal<ItemWithRelations[]>([]);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    item_id: ['', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    transaction_date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    destination: [''],
    notes: [''],
  });

  get selectedItemStock(): number | null {
    const item = this.items().find((i) => i.id === this.form.controls.item_id.value);
    return item ? item.stock : null;
  }

  async ngOnInit(): Promise<void> {
    this.items.set(await this.itemService.list());
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const stock = this.selectedItemStock;

    // Validasi awal di sisi Angular — sekadar kenyamanan (UX), bukan keamanan utama.
    if (stock !== null && raw.quantity > stock) {
      this.errorMessage.set(`Stok tidak mencukupi. Stok saat ini: ${stock}.`);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.stockMovementService.recordOutgoing({
        item_id: raw.item_id,
        quantity: raw.quantity,
        transaction_date: raw.transaction_date,
        destination: raw.destination || null,
        notes: raw.notes || null,
      });
      this.router.navigate(['/outgoing']);
    } catch (err: any) {
      // Validasi final & sesungguhnya terjadi di sini — pesan dari RPC (Bagian 4).
      this.errorMessage.set('Gagal mencatat barang keluar: ' + err.message);
    } finally {
      this.isSaving.set(false);
    }
  }
}