export type LoanStatus =
  | 'pending'
  | 'disetujui'
  | 'dipinjam'
  | 'dikembalikan'
  | 'ditolak'
  | 'dibatalkan'
  | 'terlambat';

export type BorrowerStatus = 'guru' | 'siswa';
export type ReturnCondition = 'baik' | 'rusak_ringan' | 'rusak_berat';

export interface Loan {
  id: string;
  borrower_name: string;
  borrower_contact: string;
  borrower_status: BorrowerStatus;
  borrower_class: string;
  purpose: string;
  borrow_date: string; // dipertahankan — masih dipakai alur aktif saat ini, akan digantikan di Tahap 3
  planned_return_date: string;
  actual_return_date: string | null;
  status: LoanStatus;
  notes: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;

  // ← baru di Tahap 1 — belum diisi oleh alur mana pun, menunggu Tahap 3–6
  nis?: string | null;
  transaction_code?: string | null;
  access_token?: string | null;
  planned_borrow_date?: string | null;
  actual_handover_at?: string | null;
  approved_by?: string | null;
  handed_over_by?: string | null;
  rejected_reason?: string | null;
  cancelled_reason?: string | null;
}

export interface LoanItemDetail {
  id: string;
  item_name: string;
  item_code: string;
  quantity: number;
  returned_quantity: number;

  // ← baru di Tahap 1 — belum diisi oleh alur mana pun, menunggu Tahap 6
  return_condition?: ReturnCondition | null;
  return_complete?: boolean | null;
  return_notes?: string | null;
  return_photo_url?: string | null;
  needs_inspection?: boolean;
  returned_at?: string | null;
  handed_over_quantity?: number; // ← baru Tahap 5
}

export interface LoanItemReturn {
  id: string;
  loan_detail_id: string;
  quantity: number;
  condition: ReturnCondition;
  complete: boolean;
  notes: string | null;
  photo_url: string | null;
  is_late: boolean;
  returned_at: string;
}

export interface LoanStatusHistoryEntry {
  id: string;
  from_status: LoanStatus | null;
  to_status: LoanStatus;
  changed_by_name: string | null;
  changed_at: string;
  notes: string | null;
}

export interface LoanWithItems extends Loan {
  items: LoanItemDetail[];
}