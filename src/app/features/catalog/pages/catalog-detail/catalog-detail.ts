import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';
import { LoanCartService } from '../../../../core/services/loan-cart.service';
import { ItemCatalogEntry } from '../../../../core/models/item-catalog.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './catalog-detail.html',
})
export class CatalogDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(LoanCartService);

  readonly item = signal<ItemCatalogEntry | null>(null);
  readonly quantity = signal(1);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const result = await this.catalogService.getById(id);
      if (!result) {
        this.notFound.set(true);
      } else {
        this.item.set(result);
      }
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  onBorrowClick(): void {
    const item = this.item();
    if (!item) return;
    this.cartService.add(item, this.quantity());
    this.router.navigate(['/pinjam']);
  }
}