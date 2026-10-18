import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Kumpulan ikon SVG (isi atribut "d" milik <path>), dipakai ulang di template. */
const ICONS = {
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
  loan: 'M3.5 9a7.5 7.5 0 0113-4.9L19 6.5 M19 3v3.5h-3.5 M20.5 15a7.5 7.5 0 01-13 4.9L5 17.5 M5 21v-3.5h3.5',
  bars: 'M4 14h4v7H4z M10 9h4v12h-4z M16 4h4v17h-4z',
  back: 'M3 12a9 9 0 111 6.7 M3 12V7 M3 12h5',
  dashboard: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  doc: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z M9 13h6 M9 17h6',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3.5 2',
  clipboard: 'M9 3h6v3H9z M8 4.5H6a2 2 0 00-2 2V20a1 1 0 001 1h14a1 1 0 001-1V6.5a2 2 0 00-2-2h-2 M9 13l2 2 4-4',
  pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z M12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
} as const;

type IconKey = keyof typeof ICONS;

interface HeroChip {
  icon: IconKey;
  title: string;
  sub: string;
}

interface FeatureItem {
  title: string;
  description: string;
  icon: IconKey;
  /** Warna lingkaran ikon: blue | cyan | violet | amber | green | rose. */
  tone: string;
  link: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface FacilityItem {
  id: number;
  name: string;
  category: string;
  code: string;
  location: string;
  status: 'Tersedia' | 'Dipinjam';
  image: string;
}

interface StepItem {
  title: string;
  description: string;
  icon: IconKey;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly icons = ICONS;

  /** 4 chip keunggulan di bawah tombol hero. */
  readonly heroChips: HeroChip[] = [
    { icon: 'box', title: 'Data', sub: 'Terstruktur' },
    { icon: 'search', title: 'Pencarian', sub: 'Cepat' },
    { icon: 'clipboard', title: 'Peminjaman', sub: 'Terkontrol' },
    { icon: 'clock', title: 'Akses', sub: '24/7' },
  ];

  // Placeholder statistik — ganti dengan data dari service/backend begitu tersedia
  readonly stats: StatItem[] = [
    { value: '500+', label: 'Barang Tersedia' },
    { value: '120+', label: 'Peminjaman' },
    { value: '50+', label: 'Kategori' },
    { value: '24/7', label: 'Akses Sistem' },
  ];

  readonly whyInventory: FeatureItem[] = [
    {
      title: 'Pengelolaan Barang Lebih Terstruktur',
      description: 'Setiap barang tercatat rapi berdasarkan kategori, lokasi, dan status ketersediaannya.',
      icon: 'box',
      tone: 'blue',
      link: '/katalog',
    },
    {
      title: 'Memudahkan Pencarian Barang',
      description: 'Mahasiswa dan staf dapat menemukan barang yang dibutuhkan hanya dalam hitungan detik.',
      icon: 'search',
      tone: 'cyan',
      link: '/katalog',
    },
    {
      title: 'Peminjaman Lebih Terkontrol',
      description: 'Proses pengajuan dan persetujuan peminjaman berjalan lebih tertib dan terdokumentasi.',
      icon: 'loan',
      tone: 'violet',
      link: '/pinjam',
    },
    {
      title: 'Mendukung Pelaporan Aset',
      description: 'Laporan kondisi dan riwayat penggunaan aset dapat dipantau secara berkala untuk mendukung pengambilan keputusan.',
      icon: 'bars',
      tone: 'amber',
      link: '/login',
    },
    {
      title: 'Pengembalian Barang',
      description: 'Pantau status dan riwayat pengembalian dengan mudah.',
      icon: 'back',
      tone: 'green',
      link: '/pinjam',
    },
    {
      title: 'Dashboard Ringkasan',
      description: 'Pantau kondisi inventaris melalui satu tampilan ringkas.',
      icon: 'dashboard',
      tone: 'rose',
      link: '/login',
    },
  ];

  // Temporary mock data for landing page — ganti dengan data dari CatalogService/ItemService
  // begitu bisa dipakai di landing page (id di sini hanya placeholder untuk routing /katalog/:id)
  readonly facilities: FacilityItem[] = [
    {
      id: 1,
      name: 'Kamera DSLR Canon',
      category: 'Kamera',
      code: 'CAM-01',
      location: 'Ruang Alat DKV',
      status: 'Tersedia',
      image: 'https://picsum.photos/seed/kamera-dslr-canon/400/300',
    },
    {
      id: 2,
      name: 'Kamera Mirrorless Sony',
      category: 'Kamera',
      code: 'CAM-02',
      location: 'Ruang Alat DKV',
      status: 'Tersedia',
      image: 'https://picsum.photos/seed/kamera-mirrorless-sony/400/300',
    },
    {
      id: 3,
      name: 'Drone DJI Mini',
      category: 'Drone',
      code: 'DRN-01',
      location: 'Lemari Drone',
      status: 'Dipinjam',
      image: 'https://picsum.photos/seed/drone-dji-mini/400/300',
    },
    {
      id: 4,
      name: 'Lighting Kit Studio',
      category: 'Lighting',
      code: 'LGT-01',
      location: 'Studio Foto',
      status: 'Tersedia',
      image: 'https://picsum.photos/seed/lighting-kit-studio/400/300',
    },
  ];

  readonly borrowingSteps: StepItem[] = [
    { title: 'Pilih Barang', description: 'Cari dan pilih barang yang ingin dipinjam dari katalog.', icon: 'search' },
    { title: 'Ajukan Peminjaman', description: 'Isi formulir peminjaman lengkap dengan jadwal penggunaan.', icon: 'doc' },
    { title: 'Menunggu Persetujuan', description: 'Petugas akan meninjau dan menyetujui pengajuan Anda.', icon: 'clock' },
    { title: 'Ambil Barang', description: 'Ambil barang sesuai jadwal yang telah disetujui.', icon: 'box' },
    { title: 'Kembalikan Barang', description: 'Kembalikan barang tepat waktu dalam kondisi baik.', icon: 'back' },
  ];
}