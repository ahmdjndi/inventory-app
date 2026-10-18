/**
 * Menerjemahkan error mentah dari Supabase/PostgREST/PostgreSQL menjadi pesan
 * yang mudah dipahami user. Pesan bisnis yang sudah kita tulis sendiri dalam
 * Bahasa Indonesia (lewat `raise exception` di RPC — mis. "Stok tidak mencukupi...")
 * tidak dikenali pola apa pun di bawah, sehingga diteruskan apa adanya.
 */
export function parseSupabaseError(error: unknown): string {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';

  const err = error as { message?: string; code?: string };
  const message = (err.message ?? String(error)).trim();
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }

  if (lower.includes('jwt') || lower.includes('refresh_token_not_found')) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }

  if (err.code === 'PGRST116') {
    return 'Data tidak ditemukan.';
  }

  if (err.code === '23505') {
    return 'Data ini sudah ada sebelumnya — periksa kembali isian Anda.';
  }

  if (err.code === '23503') {
    return 'Data ini masih terkait dengan data lain, sehingga tidak bisa diproses.';
  }

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Anda tidak memiliki izin untuk melakukan aksi ini.';
  }

  return message || 'Terjadi kesalahan. Silakan coba lagi.';
}