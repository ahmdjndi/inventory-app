import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { ItemService } from '../../core/services/item.service';

export function uniqueItemCodeValidator(
  itemService: ItemService,
  excludeId?: string
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const code = (control.value ?? '').trim();
    if (!code) return null;
    const taken = await itemService.isCodeTaken(code, excludeId);
    return taken ? { duplicateCode: true } : null;
  };
}