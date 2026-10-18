import { Component, computed, inject, input, output, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocationService, LocationFormValue } from '../../../../core/services/location.service';
import { uniqueLocationNameValidator } from '../../../../shared/validators/unique-location-name.validator';
import { StorageLocation } from '../../../../core/models/location.model';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './location-form.html',
  styleUrl: './location-form.css',
})
export class LocationForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);

  readonly initialLocation = input<StorageLocation | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly formSubmit = output<LocationFormValue>();

  /** true kalau form dipakai untuk mengubah lokasi yang sudah ada. */
  readonly isEditMode = computed(() => !!this.initialLocation());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    const location = this.initialLocation();
    const nameControl = this.form.controls.name;
    nameControl.addAsyncValidators(uniqueLocationNameValidator(this.locationService, location?.id));
    nameControl.updateValueAndValidity();

    if (location) {
      this.form.patchValue({
        name: location.name,
        description: location.description ?? '',
      });
    }
  }

  /** Kolom nama dianggap bermasalah kalau sudah disentuh dan belum valid. */
  get nameInvalid(): boolean {
    const control = this.form.controls.name;
    return control.touched && control.invalid;
  }

  onSubmit(): void {
    // 'pending' = nama unik masih diperiksa ke server; tunggu sampai selesai.
    if (this.form.pending) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.formSubmit.emit({ name: raw.name, description: raw.description || null });
  }
}