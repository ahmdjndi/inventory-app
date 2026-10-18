import { Injectable, signal, computed } from '@angular/core';
import { ItemCatalogEntry } from '../models/item-catalog.model';

export interface CartLine {
  item: ItemCatalogEntry;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class LoanCartService {
  private readonly _lines = signal<CartLine[]>([]);
  readonly lines = this._lines.asReadonly();
  readonly totalItems = computed(() => this._lines().reduce((sum, l) => sum + l.quantity, 0));

  add(item: ItemCatalogEntry, quantity: number): void {
    const existing = this._lines().find((l) => l.item.id === item.id);
    if (existing) {
      this.updateQuantity(item.id, existing.quantity + quantity);
    } else {
      this._lines.update((lines) => [...lines, { item, quantity }]);
    }
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(itemId);
      return;
    }
    this._lines.update((lines) =>
      lines.map((l) => (l.item.id === itemId ? { ...l, quantity } : l))
    );
  }

  remove(itemId: string): void {
    this._lines.update((lines) => lines.filter((l) => l.item.id !== itemId));
  }

  clear(): void {
    this._lines.set([]);
  }
}