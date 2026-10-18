import { Component, HostListener, computed, inject, signal } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { AuthService } from '../../core/services/auth.service';
import { StaffRole } from '../../core/models/profile.model';

interface MenuItem {
  label: string;
  path: string;
  roles: StaffRole[];
  group: 'main' | 'settings';
  icon: SafeHtml;
}

interface MenuItemConfig {
  label: string;
  path: string;
  roles: StaffRole[];
  /** Grup menu: 'main' = MENU UTAMA, 'settings' = PENGATURAN. */
  group: 'main' | 'settings';
  icon: string;
}

const MENU_ITEMS: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: ['admin'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>`,
  },
  {
    label: 'Barang',
    path: '/items',
    roles: ['admin'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8l-9-5-9 5 9 5 9-5z"/>
      <path d="M3 8v8l9 5 9-5V8"/>
      <path d="M12 13v8"/>
    </svg>`,
  },
  {
    label: 'Kategori',
    path: '/categories',
    roles: ['admin'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.6 2H4a2 2 0 00-2 2v8.6a2 2 0 00.6 1.4l8.6 8.6a2 2 0 002.8 0l7.2-7.2a2 2 0 000-2.8L13.4 2.6A2 2 0 0012.6 2z"/>
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>
    </svg>`,
  },
  {
    label: 'Lokasi',
    path: '/locations',
    roles: ['admin'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>`,
  },
  {
    label: 'Barang Masuk',
    path: '/incoming',
    roles: ['admin'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6"/>
      <path d="M7 10l5 5 5-5"/>
      <path d="M12 15V3"/>
    </svg>`,
  },
  {
    label: 'Barang Keluar',
    path: '/outgoing',
    roles: ['admin'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6"/>
      <path d="M17 8l-5-5-5 5"/>
      <path d="M12 3v12"/>
    </svg>`,
  },
  {
    label: 'Peminjaman',
    path: '/loans',
    roles: ['admin', 'petugas'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="4" width="12" height="16" rx="2"/>
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>`,
  },
  {
    label: 'Riwayat',
    path: '/transactions',
    roles: ['admin', 'petugas'],
    group: 'main',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 1 1 3 6.7"/>
      <path d="M3 12V7M3 12h5"/>
      <path d="M12 8v4l3 2"/>
    </svg>`,
  },
  {
    label: 'Admin',
    path: '/users',
    roles: ['admin'],
    group: 'settings',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <circle cx="12" cy="10" r="2.3"/>
      <path d="M8.5 16a4 4 0 017 0"/>
    </svg>`,
  },
];

/** Label role yang ditampilkan di profil. */
const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  petugas: 'Petugas',
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly authService = inject(AuthService);

  /** Status sidebar pada layar mobile/tablet. */
  readonly sidebarOpen = signal(false);

  /** Status sidebar yang diperkecil. */
  readonly sidebarCollapsed = signal(false);

  /** Nama lengkap untuk sapaan dan profil. */
  readonly fullName = computed(
    () => this.authService.currentProfile()?.full_name?.trim() || 'Pengguna',
  );

  /** Label role (Administrator / Petugas). */
  readonly roleLabel = computed(() => {
    const role = this.authService.currentProfile()?.role;
    return role ? (ROLE_LABEL[role] ?? role) : '';
  });

  /** Inisial nama pengguna untuk avatar. */
  readonly initials = computed(() => {
    const name = this.authService.currentProfile()?.full_name?.trim();

    if (!name) return '?';

    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return (first + last).toUpperCase();
  });

  /** Mengubah SVG menjadi SafeHtml untuk ditampilkan pada template. */
  private icon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /** Menu ditampilkan sesuai role pengguna yang sedang login. */
  readonly menuItems = computed<MenuItem[]>(() => {
    const role = this.authService.currentProfile()?.role;

    if (!role) return [];

    return MENU_ITEMS
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        ...item,
        icon: this.icon(item.icon),
      }));
  });

  /** Menu grup "MENU UTAMA". */
  readonly mainMenu = computed(() => this.menuItems().filter((item) => item.group === 'main'));

  /** Menu grup "PENGATURAN" (kosong untuk role yang tidak punya menu pengaturan). */
  readonly settingsMenu = computed(() => this.menuItems().filter((item) => item.group === 'settings'));

  /** Halaman awal sesuai role: menu pertama yang boleh diakses (petugas tidak punya Dashboard). */
  readonly homePath = computed(() => this.menuItems()[0]?.path ?? '/');

  /** Tekan Esc untuk menutup sidebar di layar kecil. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSidebar();
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebarWidth(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  async onLogout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}