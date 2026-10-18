import { Injectable, inject } from '@angular/core';
import { StockMovementService } from './stock-movement.service';
import { LoanService } from './loan.service';
import { LoanWithItems } from '../models/loan.model';

export type ActivityType = 'stock_in' | 'stock_out' | 'loan_created' | 'loan_returned';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  date: string;
  description: string;
  detail: string;
  loan?: LoanWithItems; // ← baru — hanya terisi untuk loan_created/loan_returned
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly stockMovementService = inject(StockMovementService);
  private readonly loanService = inject(LoanService);

  async listActivity(): Promise<ActivityEntry[]> {
    const [movements, loans] = await Promise.all([
      this.stockMovementService.listAll(),
      this.loanService.list(),
    ]);

    const movementEntries: ActivityEntry[] = movements.map((m) => ({
      id: `movement-${m.id}`,
      type: m.type === 'in' ? 'stock_in' : 'stock_out',
      date: m.created_at,
      description: `${m.type === 'in' ? 'Barang Masuk' : 'Barang Keluar'}: ${m.item_code} — ${m.item_name}`,
      detail: `${m.type === 'in' ? '+' : '-'}${m.quantity} oleh ${m.recorder_name}`,
    }));

    const loanCreatedEntries: ActivityEntry[] = loans
      .filter((l) => l.status !== 'dikembalikan')
      .map((l) => ({
        id: `loan-created-${l.id}`,
        type: 'loan_created' as const,
        date: l.created_at,
        description: `Peminjaman oleh ${l.borrower_name}`,
        detail: l.items.map((it) => `${it.item_name} x${it.quantity}`).join(', '),
        loan: l,
      }));

    const loanReturnedEntries: ActivityEntry[] = loans
      .filter((l) => l.status === 'dikembalikan' && l.actual_return_date)
      .map((l) => ({
        id: `loan-returned-${l.id}`,
        type: 'loan_returned' as const,
        date: l.actual_return_date as string,
        description: `Pengembalian oleh ${l.borrower_name}`,
        detail: l.items.map((it) => `${it.item_name} x${it.quantity}`).join(', '),
        loan: l,
      }));

    return [...movementEntries, ...loanCreatedEntries, ...loanReturnedEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}