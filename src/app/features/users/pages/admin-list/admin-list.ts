import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminService } from '../../../../core/services/admin.service';
import { Profile, StaffRole } from '../../../../core/models/profile.model';
import { parseSupabaseError } from '../../../../shared/utils/parse-error';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './admin-list.html',
})
export class AdminList implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly authService = inject(AuthService);

  readonly admins = signal<Profile[]>([]);
  readonly isLoading = signal(true);
  readonly editingId = signal<string | null>(null);
  readonly editName = signal('');
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async reload(): Promise<void> {
    this.admins.set(await this.adminService.list());
  }

  startEdit(admin: Profile): void {
    this.editingId.set(admin.id);
    this.editName.set(admin.full_name);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async saveEdit(id: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.adminService.update(id, { full_name: this.editName() });
      this.editingId.set(null);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    }
  }

  isSelf(admin: Profile): boolean {
    return admin.id === this.authService.currentProfile()?.id;
  }

  async onRoleChange(admin: Profile, newRole: string): Promise<void> {
    if (this.isSelf(admin)) return; // tidak bisa ubah role sendiri — cegah terkunci sendiri
    this.errorMessage.set(null);
    try {
      await this.adminService.setRole(admin.id, newRole as StaffRole);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    }
  }

  async onRemove(admin: Profile): Promise<void> {
    if (this.isSelf(admin)) return;
    if (!confirm(`Nonaktifkan akses "${admin.full_name}"? Tidak bisa dibatalkan dari halaman ini.`)) return;
    try {
      await this.adminService.remove(admin.id);
      await this.reload();
    } catch (err) {
      this.errorMessage.set(parseSupabaseError(err));
    }
  }
}