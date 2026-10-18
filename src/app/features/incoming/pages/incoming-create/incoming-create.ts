import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ItemService } from '../../../../core/services/item.service';
import { StockMovementService } from '../../../../core/services/stock-movement.service';
import { ItemWithRelations } from '../../../../core/models/item.model';

@Component({
  selector: 'app-incoming-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './incoming-create.html',
})
export class IncomingCreate implements OnInit {
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
    source: [''],
    notes: [''],
  });

  async ngOnInit(): Promise<void> {
    this.items.set(await this.itemService.list());
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    const raw = this.form.getRawValue();
    try {
      await this.stockMovementService.recordIncoming({
        item_id: raw.item_id,
        quantity: raw.quantity,
        transaction_date: raw.transaction_date,
        source: raw.source || null,
        notes: raw.notes || null,
      });
      this.router.navigate(['/incoming']);
    } catch (err: any) {
      this.errorMessage.set('Gagal mencatat barang masuk: ' + err.message);
    } finally {
      this.isSaving.set(false);
    }
  }
}