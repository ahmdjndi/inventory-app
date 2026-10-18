import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryForm } from '../../components/category-form/category-form';
import { CategoryService, CategoryFormValue } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CategoryForm],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Ubah Kategori</h2>
      @if (errorMessage()) {
        <p class="text-sm text-red-600 mb-4">{{ errorMessage() }}</p>
      }
      @if (isLoading()) {
        <p class="text-gray-500">Memuat data...</p>
      } @else if (notFound()) {
        <p class="text-gray-400">Data tidak ditemukan.</p>
      } @else if (category(); as c) {
        <app-category-form [initialCategory]="c" [isSaving]="isSaving()" (formSubmit)="onSubmit($event)" />
      }
    </div>
  `,
})
export class CategoryEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);

  private readonly categoryId = this.route.snapshot.paramMap.get('id')!;

  readonly category = signal<Category | null>(null);
  readonly isLoading = signal(true); // ← baru
  readonly notFound = signal(false); // ← baru
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.categoryService.getById(this.categoryId);
      if (!result) {
        this.notFound.set(true);
      } else {
        this.category.set(result);
      }
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit(value: CategoryFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.categoryService.update(this.categoryId, value);
      this.router.navigate(['/categories']);
    } catch (err) {
      this.errorMessage.set('Gagal menyimpan perubahan: ' + parseSupabaseError(err));
    } finally {
      this.isSaving.set(false);
    }
  }
}