import { Component, HostListener, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LoanCartService } from '../../core/services/loan-cart.service';
import { AuthService } from '../../core/services/auth.service';
import { PageChromeService } from '../../core/services/page-chrome.service'; 

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatIndonesianDateTime(date: Date): string {
  const day = DAY_NAMES[date.getDay()];
  const dd = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const yyyy = date.getFullYear();
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${day}, ${dd} ${month} ${yyyy} - ${hh}:${min}`;
}

interface NavLink {
  label: string;
  path: string;
  /** true = hanya aktif kalau URL persis sama (untuk Beranda "/"). */
  exact?: boolean;
  /** true = tampilkan badge jumlah barang di keranjang peminjaman. */
  cart?: boolean;
}

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout implements OnInit, OnDestroy {
  readonly cartService = inject(LoanCartService);
  readonly authService = inject(AuthService);
  readonly currentDateTime = signal(formatIndonesianDateTime(new Date()));
  readonly mobileMenuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();
  readonly pageChromeService = inject(PageChromeService);

  /** Daftar menu: dipakai navbar desktop, menu mobile, dan footer. */
  readonly navLinks: NavLink[] = [
    { label: 'Beranda', path: '/', exact: true },
    { label: 'Daftar Barang', path: '/katalog' },
    { label: 'Peminjaman', path: '/pinjam', cart: true },
    { label: 'Check Status', path: '/check-status', cart: true },
    { label: 'Tentang Kami', path: '/tentang-kami' },
  ];

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentDateTime.set(formatIndonesianDateTime(new Date()));
    }, 30_000); // cukup tiap 30 detik karena tampilan hanya sampai satuan menit
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /** Tekan Esc di keyboard untuk menutup menu mobile. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}