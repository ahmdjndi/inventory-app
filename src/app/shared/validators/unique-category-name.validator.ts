import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';

export function uniqueCategoryNameValidator(
  categoryService: CategoryService,
  excludeId?: string
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const name = (control.value ?? '').trim();
    if (!name) return null;
    const taken = await categoryService.isNameTaken(name, excludeId);
    return taken ? { duplicateName: true } : null;
  };
}