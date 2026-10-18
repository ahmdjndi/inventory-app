import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import {
  LoanCartService,
  CartLine,
} from '../../../../core/services/loan-cart.service';

import {
  LoanRequestService,
  LoanSubmissionResult,
} from '../../../../core/services/loan-request.service';

import { parseSupabaseError } from '../../../../shared/utils/parse-error';
import { PageChromeService } from '../../../../core/services/page-chrome.service'; 


/**
 * Validasi tanggal:
 * tanggal tidak boleh sebelum hari ini.
 */
function notPastDateValidator(
  control: AbstractControl
): ValidationErrors | null {
  if (!control.value) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(control.value) >= today
    ? null
    : { pastDate: true };
}


/**
 * Validasi:
 * tanggal kembali tidak boleh sebelum tanggal peminjaman.
 */
function returnAfterBorrowValidator(
  group: AbstractControl
): ValidationErrors | null {
  const borrow = group.get('plannedBorrowDate')?.value;
  const ret = group.get('plannedReturnDate')?.value;

  if (!borrow || !ret) return null;

  return new Date(ret) >= new Date(borrow)
    ? null
    : { returnBeforeBorrow: true };
}


type FieldName =
  | 'borrowerName'
  | 'borrowerContact'
  | 'borrowerStatus'
  | 'borrowerClass'
  | 'nis'
  | 'purpose'
  | 'plannedBorrowDate'
  | 'plannedReturnDate';


/**
 * Data yang disimpan setelah pengajuan berhasil.
 * Digunakan untuk menampilkan ringkasan/struk.
 */

interface SubmittedSnapshot {
  borrowerName: string;
  borrowerContact: string;
  borrowerStatus: 'guru' | 'siswa';
  borrowerClass: string;
  nis: string;
  purpose: string;
  plannedBorrowDate: string;
  plannedReturnDate: string;

  items: CartLine[];
}


/**
 * Ikon SVG yang digunakan di template.
 */
const ICONS = {
  user:
    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',

  phone:
    'M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a2.25 2.25 0 00-2.11.573l-.943.944a1.5 1.5 0 01-1.928.164 15.03 15.03 0 01-4.29-4.29 1.5 1.5 0 01.164-1.928l.944-.943a2.25 2.25 0 00.573-2.11L6.963 3.102a1.5 1.5 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',

  school:
    'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-6h6v6',

  calendar:
    'M4 7a2 2 0 012-2h12a2 2 0 012 2v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7z M4 10h16 M8 3v4 M16 3v4',

  doc:
    'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z M9 13h6 M9 17h6',

  box:
    'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',

  clipboard:
    'M9 3h6v3H9z M8 4.5H6a2 2 0 00-2 2V20a1 1 0 001 1h14a1 1 0 001-1V6.5a2 2 0 00-2-2h-2 M9 13l2 2 4-4',

  shield:
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',

  clock:
    'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2',

  teacher:
    'M12 3L2 8l10 5 10-5-10-5z M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5',

  book:
    'M2 5.5A1.5 1.5 0 013.5 4H9a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H3.5A1.5 1.5 0 012 16V5.5z M22 5.5A1.5 1.5 0 0020.5 4H15a3 3 0 00-3 3v13a2.5 2.5 0 012.5-2.5h6a1.5 1.5 0 001.5-1.5V5.5z',

  image:
    'M4 5h16v14H4z M4 15l5-5 4 4 3-3 4 4',

  trash:
    'M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',

  plus:
    'M12 5v14M5 12h14',

  minus:
    'M5 12h14',

  check:
    'M5 12l5 5L20 7',

  arrow:
    'M5 12h14 M13 6l6 6-6 6',

  alert:
    'M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z',

  chevron:
    'M9 6l6 6-6 6',
} as const;


@Component({
  selector: 'app-loan-cart',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './loan-cart.html',
  styleUrl: './loan-cart.css',
})
export class LoanCart implements OnDestroy {
  private readonly fb = inject(FormBuilder);
   private readonly pageChromeService = inject(PageChromeService);

  readonly cartService = inject(LoanCartService);

  private readonly loanRequestService =
    inject(LoanRequestService);


  readonly isSubmitting = signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly isSubmitted =
    signal(false);

  readonly receipt =
    signal<LoanSubmissionResult | null>(null);

  readonly submittedSnapshot =
    signal<SubmittedSnapshot | null>(null);


  readonly icons = ICONS;

  readonly steps = [
    'Pilih Barang',
    'Isi Data Peminjam',
    'Pengajuan Selesai',
  ];


  /**
   * Tanggal hari ini dalam format YYYY-MM-DD.
   */
  readonly todayString =
    new Date().toISOString().slice(0, 10);

  /**
   * Dipertahankan untuk kompatibilitas dengan template lama.
   */
  readonly today =
    new Date().toLocaleDateString('en-CA');


  readonly form = this.fb.nonNullable.group(
    {
      borrowerName: [
        '',
        [Validators.required],
      ],

      borrowerContact: [
        '',
        [Validators.required],
      ],

      borrowerStatus: [
        '',
        [Validators.required],
      ],

      borrowerClass: [
        '',
        [Validators.required],
      ],

      nis: [
        '',
        [Validators.required],
      ],

      purpose: [
        '',
        [Validators.required],
      ],

      plannedBorrowDate: [
        '',
        [
          Validators.required,
          notPastDateValidator,
        ],
      ],

      plannedReturnDate: [
        '',
        [Validators.required],
      ],
    },
    {
      validators: returnAfterBorrowValidator,
    }
  );


  /**
   * Jumlah jenis barang di keranjang.
   */
  readonly totalTypes = computed(
    () => this.cartService.lines().length
  );


  /**
   * Total seluruh unit barang.
   */
  readonly totalUnits = computed(() =>
    this.cartService
      .lines()
      .reduce(
        (sum, line) => sum + line.quantity,
        0
      )
  );


  /**
   * Tahap aktif:
   *
   * 1 = pilih barang
   * 2 = isi data peminjam
   * 3 = pengajuan selesai
   */
  readonly currentStep = computed(() => {
    if (this.isSubmitted()) return 3;

    return this.cartService.lines().length === 0
      ? 1
      : 2;
  });


  updateQuantity(
    itemId: string,
    value: string
  ): void {
    this.cartService.updateQuantity(
      itemId,
      Number(value)
    );
  }


  /**
   * Tombol - dan +.
   *
   * Jumlah dijaga antara 1 dan stok maksimum.
   */
  step(
    itemId: string,
    current: number,
    max: number,
    delta: number
  ): void {
    const next = Math.min(
      Math.max(1, current + delta),
      Math.max(1, max)
    );

    if (next !== current) {
      this.cartService.updateQuantity(
        itemId,
        next
      );
    }
  }


  /**
   * Mengecek apakah field sedang invalid
   * dan sudah disentuh.
   */
  isInvalid(name: FieldName): boolean {
    const control = this.form.controls[name];

    return control.touched && control.invalid;
  }


  /**
   * Menampilkan tanggal rencana kembali
   * dalam format Indonesia.
   */
  plannedDateLabel(): string | null {
    const value =
      this.form.controls.plannedReturnDate.value;

    return value
      ? this.formatDate(
          new Date(value + 'T00:00:00')
        )
      : null;
  }


  /**
   * Menghitung durasi peminjaman
   * berdasarkan tanggal hari ini.
   */
  durationLabel(): string | null {
    const value =
      this.form.controls.plannedReturnDate.value;

    if (!value) return null;

    const start =
      new Date(new Date().toDateString());

    const end =
      new Date(value + 'T00:00:00');

    const days = Math.round(
      (end.getTime() - start.getTime()) /
        86_400_000
    );

    if (Number.isNaN(days) || days < 0) {
      return null;
    }

    return days === 0
      ? 'Hari ini'
      : `${days} hari`;
  }


  async onSubmit(): Promise<void> {
    if (
      this.form.invalid ||
      this.cartService.lines().length === 0
    ) {
      this.form.markAllAsTouched();
      return;
    }


    this.isSubmitting.set(true);
    this.errorMessage.set(null);


    const raw =
      this.form.getRawValue();

    /**
     * Simpan snapshot sebelum cart dikosongkan.
     */
    const linesSnapshot =
      [...this.cartService.lines()];


    try {
      const result =
        await this.loanRequestService.submit({
          borrowerName:
            raw.borrowerName,

          borrowerContact:
            raw.borrowerContact,

          borrowerStatus:
            raw.borrowerStatus as 'guru' | 'siswa',

          borrowerClass:
            raw.borrowerClass,

          nis:
            raw.nis,

          purpose:
            raw.purpose,

          plannedBorrowDate:
            raw.plannedBorrowDate,

          plannedReturnDate:
            raw.plannedReturnDate,

          items:
            linesSnapshot.map((line) => ({
              item_id: line.item.id,
              quantity: line.quantity,
            })),
        });


      /**
       * Simpan data untuk ringkasan/struk.
       */
      
this.submittedSnapshot.set({
  borrowerName: raw.borrowerName,
  borrowerContact: raw.borrowerContact,
  borrowerStatus: raw.borrowerStatus as 'guru' | 'siswa',
  borrowerClass: raw.borrowerClass,
  nis: raw.nis,
  purpose: raw.purpose,
  plannedBorrowDate: raw.plannedBorrowDate,
  plannedReturnDate: raw.plannedReturnDate,
  items: linesSnapshot,
});


      /**
       * Simpan hasil pengajuan.
       */
      this.receipt.set(result);


      /**
       * Kosongkan keranjang setelah berhasil.
       */
      this.cartService.clear();


      // Sembunyikan header dan footer.
      this.pageChromeService.hideChrome.set(true);

      /**
       * Tandai pengajuan berhasil.
       */
      this.isSubmitted.set(true);


      /**
       * Scroll ke atas untuk menampilkan
       * halaman hasil pengajuan.
       */
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

    } catch (err) {
      this.errorMessage.set(
        'Gagal mengajukan peminjaman: ' +
        parseSupabaseError(err)
      );

    } finally {
      this.isSubmitting.set(false);
    }
  }


  private formatDate(
    date: Date
  ): string {
    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ).format(date);
  }


  private formatDateTime(
    date: Date
  ): string {
    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    ).format(date);
  }

  
onPrint(): void {
  window.print();
}
ngOnDestroy(): void { // ← baru
    this.pageChromeService.hideChrome.set(false);
  }
}
