import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Ikon SVG (isi atribut "d" milik <path>), dipakai ulang di template. */
const ICONS = {
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
  building: 'M4 21V7l8-4 8 4v14 M9 21v-6h6v6 M9 11h.01 M15 11h.01',
  users: 'M9 11a3 3 0 100-6 3 3 0 000 6z M2.5 20a6.5 6.5 0 0113 0 M17.5 12a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6z M15.8 20a5 5 0 016.7-4.7',
  cap: 'M2 8l10-4.5L22 8l-10 4.5L2 8z M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5 M22 8v6',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  doc: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z M9 13h6 M9 17h6',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  checkCircle: 'M12 3a9 9 0 100 18 9 9 0 000-18z M8.5 12.5l2.5 2.5 4.5-5',
  database: 'M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3',
  refresh: 'M21 12a9 9 0 11-3-6.7 M21 4v5h-5',
  device: 'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z M10 18h4',
  pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z M12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a2.25 2.25 0 00-2.11.573l-.943.944a1.5 1.5 0 01-1.928.164 15.03 15.03 0 01-4.29-4.29 1.5 1.5 0 01.164-1.928l.944-.943a2.25 2.25 0 00.573-2.11L6.963 3.102a1.5 1.5 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  mail: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M9 6l6 6-6 6',
} as const;

type IconKey = keyof typeof ICONS;

interface StatItem {
  value: string;
  label: string;
  icon: IconKey;
  /** Warna lingkaran ikon: blue | green | violet | amber. */
  tone: string;
}

interface OrgNode {
  role: string;
  name: string;
}

interface InfoItem {
  title: string;
  text: string;
}

interface IconInfoItem extends InfoItem {
  icon: IconKey;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  private readonly sanitizer = inject(DomSanitizer);

  readonly icons = ICONS;

  readonly stats: StatItem[] = [
    { value: '100+', label: 'Inventaris Barang', icon: 'box', tone: 'blue' },
    { value: '3', label: 'Ruangan Lab', icon: 'building', tone: 'green' },
    { value: '4', label: 'Guru Produktif', icon: 'users', tone: 'violet' },
    { value: '100+', label: 'Mahasiswa Aktif', icon: 'cap', tone: 'amber' },
  ];

  /** Baris pada panel "Ringkasan Sistem". */
  readonly summaryRows: { label: string; icon: IconKey }[] = [
    { label: 'Barang Terdata', icon: 'box' },
    { label: 'Peminjaman Digital', icon: 'doc' },
    { label: 'Pengelolaan Terpusat', icon: 'grid' },
  ];

  readonly goals: InfoItem[] = [
    { title: 'Digitalisasi', text: 'Membantu mengubah proses pencatatan inventaris dari cara manual menjadi digital.' },
    { title: 'Efisiensi', text: 'Mempermudah pengguna menemukan informasi barang dan melakukan pengajuan peminjaman.' },
    { title: 'Transparansi', text: 'Memberikan informasi ketersediaan dan kondisi barang secara lebih jelas.' },
    { title: 'Pengelolaan Terstruktur', text: 'Membantu data inventaris tersimpan dan dikelola secara lebih terorganisir.' },
  ];

  readonly benefits: IconInfoItem[] = [
    { title: 'Mudah Digunakan', text: 'Antarmuka sederhana dan mudah dipahami oleh pengguna baru sekalipun.', icon: 'checkCircle' },
    { title: 'Informasi Terpusat', text: 'Semua informasi barang dapat diakses melalui satu sistem yang sama.', icon: 'database' },
    { title: 'Pencarian Cepat', text: 'Cari barang berdasarkan nama, kode, atau kategori dalam hitungan detik.', icon: 'search' },
    { title: 'Pengajuan Peminjaman', text: 'Ajukan peminjaman barang langsung melalui sistem, tanpa formulir kertas.', icon: 'doc' },
    { title: 'Data Selalu Diperbarui', text: 'Status dan ketersediaan barang mengikuti data terbaru yang tercatat di sistem.', icon: 'refresh' },
    { title: 'Responsif', text: 'Dapat digunakan dengan nyaman melalui desktop, tablet, maupun smartphone.', icon: 'device' },
  ];

  readonly steps: InfoItem[] = [
    { title: 'Cari Barang', text: 'Temukan barang yang ingin digunakan.' },
    { title: 'Lihat Informasi', text: 'Periksa gambar, kategori, status, dan detail barang.' },
    { title: 'Ajukan Peminjaman', text: 'Lengkapi formulir peminjaman melalui sistem.' },
    { title: 'Menunggu Proses', text: 'Pengajuan diproses sesuai mekanisme sistem.' },
  ];

  // TODO: ganti dengan data struktur organisasi yang sebenarnya
  readonly orgTop: OrgNode = { role: 'Kepala Jurusan DKV', name: 'Nama Kepala Jurusan' };

  readonly orgChildren: OrgNode[] = [
    { role: 'Wakil Kepala Jurusan', name: 'Nama Guru' },
    { role: 'Koordinator Kurikulum', name: 'Nama Guru' },
    { role: 'Koordinator Sarpras', name: 'Nama Guru' },
    { role: 'Koordinator Kesiswaan', name: 'Nama Guru' },
  ];

  readonly orgBottom: OrgNode = { role: 'Staf Tata Usaha', name: 'Nama Staf' };

  // TODO: ganti dengan data sekolah yang sebenarnya
  readonly schoolInfo = {
    address: 'Jl. Raya Klakah, Kecamatan Klakah, Kabupaten Lumajang, Jawa Timur',
    phone: '(0331) 876253xx',
    email: 'inventory@gmail.com',
    website: 'inventory.smkn-klakah.sch.id',
    mapEmbedUrl: 'https://www.google.com/maps?q=SMKN+Klakah,+Lumajang,+Jawa+Timur&output=embed',
  };

  /** Angular memblokir alamat <iframe> dari string biasa; alamat peta ini dari kode kita sendiri, jadi aman ditandai terpercaya. */
  readonly mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    this.schoolInfo.mapEmbedUrl,
  );
}