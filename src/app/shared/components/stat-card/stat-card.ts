import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  styleUrl: './stat-card.css',
  template: `
    <div class="stat-card" [class.stat-card--blue]="tone() === 'blue'" [class.stat-card--cyan]="tone() === 'cyan'" [class.stat-card--violet]="tone() === 'violet'" [class.stat-card--green]="tone() === 'green'" [class.stat-card--orange]="tone() === 'orange'" [class.stat-card--amber]="tone() === 'amber'">
      <span class="stat-card__icon" aria-hidden="true">{{ icon() }}</span>
      <p class="stat-card__label">{{ label() }}</p>
      <p class="stat-card__value">{{ value() }}</p>
    </div>
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input('▦');
  readonly tone = input('blue');
}
