import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);

  readonly currentProfile = signal<Profile | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly sessionExpired = signal(false);

  private isSigningOut = false;

  get isLoggedIn(): boolean {
    return this.currentProfile() !== null;
  }

  get isAdmin(): boolean {
    return this.currentProfile()?.role === 'admin';
  }

  get isStaff(): boolean {
    const role = this.currentProfile()?.role;
    return role === 'admin' || role === 'petugas';
  }

  async initSession(): Promise<void> {
    const { data } = await this.supabaseService.supabase.auth.getSession();
    if (data.session) {
      await this.loadProfile(data.session.user.id);
    }
    this.isLoading.set(false);

    this.supabaseService.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await this.loadProfile(session.user.id);
      } else {
        const hadActiveProfile = this.currentProfile() !== null;
        this.currentProfile.set(null);
        if (hadActiveProfile && !this.isSigningOut) {
          this.sessionExpired.set(true);
        }
        this.isSigningOut = false;
      }
    });
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
    // ← perbaikan: tunggu profil (termasuk role) termuat SEBELUM mengembalikan kontrol,
    // supaya komponen Login bisa langsung membaca role yang benar untuk redirect.
    if (data.user) {
      await this.loadProfile(data.user.id);
    }
    return { error: null };
  }

  async signOut(): Promise<void> {
    this.isSigningOut = true;
    await this.supabaseService.supabase.auth.signOut();
    this.currentProfile.set(null);
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabaseService.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      this.currentProfile.set(data as Profile);
    }
  }
}