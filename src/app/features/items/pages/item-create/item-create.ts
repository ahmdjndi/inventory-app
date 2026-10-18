import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ItemForm } from '../../components/item-form/item-form';
import { ItemService, ItemFormValue } from '../../../../core/services/item.service';

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [ItemForm],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Tambah Barang</h2>
      @if (errorMessage()) {
        <p class="text-sm text-red-600 mb-4">{{ errorMessage() }}</p>
      }
      <app-item-form [isSaving]="isSaving()" (formSubmit)="onSubmit($event)" />
    </div>
  `,
})
export class ItemCreate {
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);

  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async onSubmit(value: ItemFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.itemService.create(value);
      this.router.navigate(['/items']);
    } catch (err: any) {
      this.errorMessage.set('Gagal menyimpan barang: ' + err.message);
    } finally {
      this.isSaving.set(false);
    }
  }
}