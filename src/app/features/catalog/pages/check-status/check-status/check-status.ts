import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LoanStatusCheckService, LoanStatusResult } from '../../../../../core/services/loan-status-check.service';
import { parseSupabaseError } from '../../../../../shared/utils/parse-error';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  disetujui: 'Disetujui / Siap Diserahkan',
  dipinjam: 'Sedang Dipinjam',
  dikembalikan: 'Selesai',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

@Component({
  selector: 'app-check-status',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './check-status.html',
})
export class CheckStatus {
  private readonly fb = inject(FormBuilder);
  private readonly statusService = inject(LoanStatusCheckService);

  readonly isChecking = signal(false);
  readonly result = signal<LoanStatusResult | null>(null);
  readonly notFound = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    transactionCode: ['', [Validators.required]],
    accessToken: ['', [Validators.required]],
  });

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isChecking.set(true);
    this.errorMessage.set(null);
    this.result.set(null);
    this.notFound.set(false);

    const { transactionCode, accessToken } = this.form.getRawValue();
    try {
      const result = await this.statusService.check(transactionCode.trim(), accessToken.trim());
      if (result) {
        this.result.set(result);
      } else {
        this.notFound.set(true);
      }
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isChecking.set(false);
    }
  }
}