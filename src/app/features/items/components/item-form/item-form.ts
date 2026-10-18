import { Component, computed, inject, input, output, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from '../../../../core/services/category.service';
import { LocationService } from '../../../../core/services/location.service';
import { ItemService, ItemFormValue } from '../../../../core/services/item.service';
import { StorageService } from '../../../../core/services/storage.service';
import { uniqueItemCodeValidator } from '../../../../shared/validators/unique-code.validator';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';
import { Category } from '../../../../core/models/category.model';
import { StorageLocation } from '../../../../core/models/location.model';
import { Item } from '../../../../core/models/item.model';

type FieldName = 'code' | 'name' | 'stock' | 'unit' | 'price';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
})
export class ItemForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly locationService = inject(LocationService);
  private readonly itemService = inject(ItemService);
  private readonly storageService = inject(StorageService);

  readonly initialItem = input<Item | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly formSubmit = output<ItemFormValue>();

  /** true kalau form dipakai untuk mengubah barang yang sudah ada. */
  readonly isEditMode = computed(() => !!this.initialItem());

  readonly categories = signal<Category[]>([]);
  readonly locations = signal<StorageLocation[]>([]);

  readonly isUploadingPhoto = signal(false);
  readonly photoError = signal<string | null>(null);

  /** Pilihan kondisi barang (ditampilkan sebagai kartu pilihan). */
  readonly conditions = [
    { value: 'baik', label: 'Baik', tone: 'ok' },
    { value: 'rusak_ringan', label: 'Rusak Ringan', tone: 'warn' },
    { value: 'rusak_berat', label: 'Rusak Berat', tone: 'bad' },
  ];

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    category_id: [''],
    location_id: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    unit: ['', [Validators.required]],
    condition: ['baik', [Validators.required]],
    price: [null as number | null, [Validators.min(0)]],
    purchase_date: [''],
    description: [''],
    photo_url: [''],
  });

  async ngOnInit(): Promise<void> {
    const [cats, locs] = await Promise.all([
      this.categoryService.list(),
      this.locationService.list(),
    ]);
    this.categories.set(cats);
    this.locations.set(locs);

    const item = this.initialItem();
    const codeControl = this.form.controls.code;
    codeControl.addAsyncValidators(uniqueItemCodeValidator(this.itemService, item?.id));
    codeControl.updateValueAndValidity();

    if (item) {
      this.form.patchValue({
        code: item.code,
        name: item.name,
        category_id: item.category_id ?? '',
        location_id: item.location_id ?? '',
        stock: item.stock,
        unit: item.unit,
        condition: item.condition,
        price: item.price,
        purchase_date: item.purchase_date ?? '',
        description: item.description ?? '',
        photo_url: item.photo_url ?? '',
      });
    }
  }

  /** Kolom dianggap bermasalah kalau sudah disentuh dan belum valid. */
  isInvalid(name: FieldName): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.photoError.set('File harus berupa gambar.');
      fileInput.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError.set('Ukuran foto maksimal 2MB.');
      fileInput.value = '';
      return;
    }

    this.photoError.set(null);
    this.isUploadingPhoto.set(true);
    try {
      const url = await this.storageService.uploadItemPhoto(file);
      this.form.patchValue({ photo_url: url });
    } catch (err) {
      this.photoError.set('Gagal mengunggah foto: ' + parseSupabaseError(err));
    } finally {
      this.isUploadingPhoto.set(false);
      fileInput.value = ''; // supaya foto yang sama bisa dipilih ulang
    }
  }

  removePhoto(): void {
    this.form.patchValue({ photo_url: '' });
    this.photoError.set(null);
  }

  onSubmit(): void {
    // 'pending' = kode unik masih diperiksa ke server; tunggu sampai selesai.
    if (this.form.pending || this.isUploadingPhoto()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      ...raw,
      category_id: raw.category_id || null,
      location_id: raw.location_id || null,
      purchase_date: raw.purchase_date || null,
      description: raw.description || null,
      photo_url: raw.photo_url || null,
    });
  }
}