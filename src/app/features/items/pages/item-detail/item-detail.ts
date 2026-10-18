import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ItemService } from '../../../../core/services/item.service';
import { ItemWithRelations } from '../../../../core/models/item.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './item-detail.html',
})
export class ItemDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly itemService = inject(ItemService);

  readonly item = signal<ItemWithRelations | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.item.set(await this.itemService.getById(id));
  }
}