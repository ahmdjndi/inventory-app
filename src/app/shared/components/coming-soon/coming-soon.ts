import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
      <h2 class="text-lg font-semibold text-gray-700">{{ title }}</h2>
      <p class="mt-2">Modul ini akan dibangun pada fase berikutnya.</p>
    </div>
  `,
})
export class ComingSoon{
  private readonly route = inject(ActivatedRoute);
  readonly title: string = this.route.snapshot.data['title'] ?? 'Halaman';
}