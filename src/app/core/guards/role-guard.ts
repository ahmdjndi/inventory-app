import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StaffRole } from '../models/profile.model';

export function roleGuard(allowedRoles: StaffRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.currentProfile()?.role;

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Fallback ke '/loans' (bukan '/dashboard') — satu-satunya halaman yang
    // bisa diakses KEDUA role, sehingga tidak terjadi redirect loop.
    return router.parseUrl('/loans');
  };
}