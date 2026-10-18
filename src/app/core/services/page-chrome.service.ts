import { Injectable, signal } from '@angular/core';

/** Dipakai untuk menyembunyikan navbar/footer publik di halaman tertentu
 *  (mis. Bukti Pengajuan) tanpa mengubah struktur routing/layout. */
@Injectable({ providedIn: 'root' })
export class PageChromeService {
  readonly hideChrome = signal(false);
}