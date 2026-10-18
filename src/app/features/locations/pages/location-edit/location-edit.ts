import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationForm } from '../../components/location-form/location-form';
import { LocationService, LocationFormValue } from '../../../../core/services/location.service';
import { StorageLocation } from '../../../../core/models/location.model';

@Component({
  selector: 'app-location-edit',
  standalone: true,
  imports: [LocationForm],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Ubah Lokasi</h2>
      @if (errorMessage()) {
        <p class="text-sm text-red-600 mb-4">{{ errorMessage() }}</p>
      }
      @if (location(); as l) {
        <app-location-form [initialLocation]="l" [isSaving]="isSaving()" (formSubmit)="onSubmit($event)" />
      }
    </div>
  `,
})
export class LocationEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationService);

  private readonly locationId = this.route.snapshot.paramMap.get('id')!;

  readonly location = signal<StorageLocation | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.location.set(await this.locationService.getById(this.locationId));
  }

  async onSubmit(value: LocationFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.locationService.update(this.locationId, value);
      this.router.navigate(['/locations']);
    } catch (err: any) {
      this.errorMessage.set('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      this.isSaving.set(false);
    }
  }
}