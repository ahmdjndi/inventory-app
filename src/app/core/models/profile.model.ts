export type StaffRole = 'admin' | 'petugas';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: StaffRole;
  created_at: string;
  updated_at: string;
}