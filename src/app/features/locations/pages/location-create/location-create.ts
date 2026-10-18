import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocationForm } from '../../components/location-form/location-form';
import { LocationService, LocationFormValue } from '../../../../core/services/location.service';

@Component({
  selector: 'app-location-create',
  standalone: true,
  imports: [LocationForm],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Tambah Lokasi</h2>
      @if (errorMessage()) {
        <p class="text-sm text-red-600 mb-4">{{ errorMessage() }}</p>
      }
      <app-location-form [isSaving]="isSaving()" (formSubmit)="onSubmit($event)" />
    </div>
  `,
})
export class LocationCreate {
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);

  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async onSubmit(value: LocationFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.locationService.create(value);
      this.router.navigate(['/locations']);
    } catch (err: any) {
      this.errorMessage.set('Gagal menyimpan lokasi: ' + err.message);
    } finally {
      this.isSaving.set(false);
    }
  }
}