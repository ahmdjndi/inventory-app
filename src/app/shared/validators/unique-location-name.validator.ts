import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { LocationService } from '../../core/services/location.service';

export function uniqueLocationNameValidator(
  locationService: LocationService,
  excludeId?: string
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const name = (control.value ?? '').trim();
    if (!name) return null;
    const taken = await locationService.isNameTaken(name, excludeId);
    return taken ? { duplicateName: true } : null;
  };
}