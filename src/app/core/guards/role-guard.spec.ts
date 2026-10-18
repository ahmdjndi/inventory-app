import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { roleGuard } from './role-guard';
import { AuthService } from '../services/auth.service';
import { Profile } from '../models/profile.model';

function mockProfile(role: 'admin' | 'petugas'): Profile {
  return { id: 'u1', full_name: 'Test', email: 't@t.com', role, created_at: '', updated_at: '' };
}

describe('roleGuard', () => {
  function run(role: 'admin' | 'petugas' | null, allowed: ('admin' | 'petugas')[]) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { currentProfile: signal(role ? mockProfile(role) : null) },
        },
        {
          provide: Router,
          useValue: { parseUrl: (url: string) => ({ toString: () => url }) as unknown as UrlTree },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => roleGuard(allowed)({} as any, {} as any));
  }

  it('mengizinkan akses (true) jika role Admin dan Admin termasuk allowedRoles', () => {
    expect(run('admin', ['admin'])).toBe(true);
  });

  it('menolak akses (bukan true/UrlTree redirect) jika Petugas mengakses rute khusus Admin', () => {
    const result = run('petugas', ['admin']);
    expect(result).not.toBe(true);
  });

  it('mengizinkan akses jika role termasuk dalam allowedRoles ganda (Admin & Petugas)', () => {
    expect(run('petugas', ['admin', 'petugas'])).toBe(true);
  });

  it('menolak akses jika belum login (currentProfile null)', () => {
    const result = run(null, ['admin']);
    expect(result).not.toBe(true);
  });
});