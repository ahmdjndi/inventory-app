export type ActivityType =
  | 'stock_in' | 'stock_out'
  | 'loan_pending' | 'loan_disetujui' | 'loan_dipinjam'
  | 'loan_dikembalikan' | 'loan_ditolak' | 'loan_dibatalkan'
  | 'loan_return_item';

export interface ActivityLogEntry {
  activity_id: string;
  activity_type: ActivityType;
  activity_date: string;
  item_name: string | null;
  item_code: string | null;
  quantity: number | null;
  borrower_name: string | null;
  transaction_code: string | null;
  condition: string | null;
  complete: boolean | null;
  is_late: boolean | null;
  actor_name: string | null;
  notes: string | null;
}