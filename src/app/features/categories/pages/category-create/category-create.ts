import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryForm } from '../../components/category-form/category-form';
import { CategoryService, CategoryFormValue } from '../../../../core/services/category.service';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CategoryForm],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Tambah Kategori</h2>
      @if (errorMessage()) {
        <p class="text-sm text-red-600 mb-4">{{ errorMessage() }}</p>
      }
      <app-category-form [isSaving]="isSaving()" (formSubmit)="onSubmit($event)" />
    </div>
  `,
})
export class CategoryCreate {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async onSubmit(value: CategoryFormValue): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.categoryService.create(value);
      this.router.navigate(['/categories']);
    } catch (err) { // ← sebelumnya: err: any
      this.errorMessage.set('Gagal menyimpan kategori: ' + parseSupabaseError(err)); // ← sebelumnya: err.message
    } finally {
      this.isSaving.set(false);
    }
  }
}