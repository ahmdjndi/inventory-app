import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemForm } from '../../components/item-form/item-form';
import { ItemService, ItemFormValue } from '../../../../core/services/item.service';
import { Item } from '../../../../core/models/item.model';

@Component({
  selector: 'app-item-edit',
  standalone: true,
  imports: [ItemForm],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Ubah Barang</h2>
      @if (errorMessage()) {
        <p class="text-sm text-red-600 mb-4">{{ errorMessage() }}</p>
      }
      @if (item(); as it) {
        <app-item-form [initialItem]="it" [isSaving]="isSaving()" (formSubmit)="onSubmit($event)" />
      }
    </div>
  `,
})
export class ItemEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly itemService = inject(ItemService);

  private readonly itemId = this.route.snapshot.paramMap.get('id')!;

  readonly item = signal<Item | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.item.set(await this.itemService.getById(this.itemId));
  }

  async onSubmit(value: ItemFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.itemService.update(this.itemId, value);
      this.router.navigate(['/items']);
    } catch (err: any) {
      this.errorMessage.set('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      this.isSaving.set(false);
    }
  }
}