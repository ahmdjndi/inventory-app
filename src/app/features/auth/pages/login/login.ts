import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Lokasi file logo di folder public/ (awali dengan "/" supaya path
   * selalu benar di semua rute). Logo ikon dipakai di pojok kiri atas
   * panel form.
   *
   * Pastikan nama file persis sama dengan yang ada di folder public/.
   * Disarankan tanpa spasi, misalnya: logo1.png.
   */
  readonly logoTop = '/logo1.png';

  /** Menjadi true kalau file logo gagal dimuat, supaya tampil pengganti. */
  readonly logoTopFailed = signal(false);

  sessionExpiredNotice = signal('');

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly capsLockOn = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /** Deteksi Caps Lock saat mengetik di kolom password. */
  onPasswordKey(event: KeyboardEvent): void {
    this.capsLockOn.set(event.getModifierState?.('CapsLock') ?? false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    const { error } = await this.authService.signIn(email.trim(), password);

    this.isSubmitting.set(false);

    if (error) {
      this.errorMessage.set('Email atau password salah.');
    } else {
      const role = this.authService.currentProfile()?.role;
      this.router.navigate([role === 'petugas' ? '/loans' : '/dashboard']);
    }
  }
}