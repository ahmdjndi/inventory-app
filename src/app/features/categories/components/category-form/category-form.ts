import { Component, inject, input, output, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CategoryService, CategoryFormValue } from '../../../../core/services/category.service';
import { uniqueCategoryNameValidator } from '../../../../shared/validators/unique-category-name.validator';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  readonly initialCategory = input<Category | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly formSubmit = output<CategoryFormValue>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    const category = this.initialCategory();
    const nameControl = this.form.controls.name;
    nameControl.addAsyncValidators(uniqueCategoryNameValidator(this.categoryService, category?.id));
    nameControl.updateValueAndValidity();

    if (category) {
      this.form.patchValue({
        name: category.name,
        description: category.description ?? '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.formSubmit.emit({ name: raw.name, description: raw.description || null });
  }
}