import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const GDRIVE_SCRIPT = 'https://accounts.google.com/gsi/client';
const OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'part-manager.json';
const GDRIVE_FILE_ID_KEY = 'gdrive-file-id';
const GDRIVE_CLIENT_ID_KEY = 'gdrive-client-id';
const GDRIVE_ACCESS_TOKEN_KEY = 'gdrive-access-token';
const GDRIVE_OAUTH_CALLBACK_KEY = 'gdrive_oauth_callback';
const GDRIVE_CODE_VERIFIER_KEY = 'gdrive_code_verifier';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_CLIENT_ID = '838239311300-ji616dlcecp6upb9417t6jf0agqh7mt0.apps.googleusercontent.com';
const GDRIVE_NATIVE_REDIRECT_URI_KEY = 'gdrive-native-redirect-uri';
const DEFAULT_NATIVE_REDIRECT_URI = 'https://0x20cello.github.io/apt-manager/oauth-redirect';
export const NATIVE_APP_SCHEME = 'com.apartmentmanager.app';
export const GDRIVE_CONFIG_LOADED_EVENT = 'gdrive-config-loaded';

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string; error?: string }) => void;
            prompt?: string;
          }) => TokenClient;
          revoke: (token: string, done: (r: { successful: boolean }) => void) => void;
        };
      };
    };
    gapiLoad?: () => void;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleDriveService {
  private platformId = inject(PLATFORM_ID);
  private accessToken: string | null = this.loadAccessToken();
  private tokenClient: TokenClient | null = null;
  private fileId: string | null = this.loadFileId();
  private connectedSignal = signal<boolean>(!!this.accessToken);

  readonly connected = this.connectedSignal.asReadonly();
  readonly clientId = signal<string>(this.loadClientId());
  readonly nativeRedirectUri = signal<string>(this.loadNativeRedirectUri());
  readonly lastError = signal<string | null>(null);
  readonly isSaving = signal<boolean>(false);

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.handleOAuthCallback();
      window.addEventListener('hashchange', () => this.handleOAuthCallback());
      if (Capacitor.isNativePlatform()) {
        App.addListener('appUrlOpen', (e: { url: string }) => this.handleOAuthFromUrl(e.url));
      }
      if (this.accessToken) {
        this.connectedSignal.set(true);
        this.triggerConfigLoad();
      }
    }
  }

  private applyOAuthParams(params: URLSearchParams): boolean {
    const token = params.get('access_token');
    const error = params.get('error');
    if (error) {
      this.lastError.set(error);
      return true;
    }
    if (token) {
      this.storeAccessToken(token);
      this.connectedSignal.set(true);
      this.lastError.set(null);
      this.triggerConfigLoad();
      return true;
    }
    return false;
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<string | null> {
    const body = new URLSearchParams({
      code,
      code_verifier: codeVerifier,
      client_id: this.clientId(),
      redirect_uri: this.getRedirectUri(),
      grant_type: 'authorization_code',
    });
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      this.lastError.set(err.error || `Token exchange failed: ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token || null;
  }

  private handleOAuthFromUrl(url: string): void {
    try {
      const parsed = new URL(url);
      const fromHash = parsed.hash?.slice(1);
      const fromSearch = parsed.search?.slice(1);
      const s = fromHash || fromSearch;
      if (!s) return;
      const params = new URLSearchParams(s);
      const code = params.get('code');
      const error = params.get('error');
      if (error) {
        this.lastError.set(error);
        return;
      }
      if (code) {
        const verifier = sessionStorage.getItem(GDRIVE_CODE_VERIFIER_KEY);
        sessionStorage.removeItem(GDRIVE_CODE_VERIFIER_KEY);
        if (verifier) {
          this.exchangeCodeForToken(code, verifier).then((token) => {
            if (token) {
              this.storeAccessToken(token);
              this.connectedSignal.set(true);
              this.lastError.set(null);
              this.triggerConfigLoad();
            }
          });
        }
        return;
      }
      if (this.applyOAuthParams(params)) {
        try {
          sessionStorage.removeItem(GDRIVE_OAUTH_CALLBACK_KEY);
        } catch {
          //
        }
      }
    } catch {
      //
    }
  }

  private handleOAuthCallback(): void {
    let params: URLSearchParams | null = null;
    try {
      const stored = sessionStorage.getItem(GDRIVE_OAUTH_CALLBACK_KEY);
      if (stored) {
        params = new URLSearchParams(stored);
        sessionStorage.removeItem(GDRIVE_OAUTH_CALLBACK_KEY);
      }
    } catch {
      //
    }
    if (!params) {
      const hash = window.location.hash?.slice(1);
      const search = window.location.search?.slice(1);
      const s = (hash && (hash.includes('access_token=') || hash.includes('error=') || hash.includes('code='))) ? hash
        : (search && (search.includes('access_token=') || search.includes('error=') || search.includes('code='))) ? search
          : null;
      if (!s) return;
      params = new URLSearchParams(s);
    }
    if (!params) return;
    const code = params.get('code');
    if (code) {
      const verifier = sessionStorage.getItem(GDRIVE_CODE_VERIFIER_KEY);
      sessionStorage.removeItem(GDRIVE_CODE_VERIFIER_KEY);
      if (verifier) {
        this.exchangeCodeForToken(code, verifier).then((token) => {
          if (token) {
            this.storeAccessToken(token);
            this.connectedSignal.set(true);
            this.lastError.set(null);
            this.triggerConfigLoad();
          }
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname || '/');
          }
        });
      }
      return;
    }
    if (!this.applyOAuthParams(params)) return;
    if (typeof window !== 'undefined') {
      const path = (window.location.pathname || '/') + (window.location.search || '');
      window.history.replaceState(null, '', path);
    }
  }

  private useRedirectFlow(): boolean {
    return Capacitor.isNativePlatform();
  }

  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join('');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return b64;
  }

  private loadFileId(): string | null {
    return localStorage.getItem(GDRIVE_FILE_ID_KEY);
  }

  private loadClientId(): string {
    return localStorage.getItem(GDRIVE_CLIENT_ID_KEY) ?? DEFAULT_CLIENT_ID;
  }

  private loadAccessToken(): string | null {
    return localStorage.getItem(GDRIVE_ACCESS_TOKEN_KEY);
  }

  setClientId(id: string): void {
    this.clientId.set(id);
    if (id) {
      localStorage.setItem(GDRIVE_CLIENT_ID_KEY, id);
    } else {
      localStorage.removeItem(GDRIVE_CLIENT_ID_KEY);
    }
  }

  private loadNativeRedirectUri(): string {
    return typeof localStorage !== 'undefined'
      ? (localStorage.getItem(GDRIVE_NATIVE_REDIRECT_URI_KEY) || DEFAULT_NATIVE_REDIRECT_URI)
      : DEFAULT_NATIVE_REDIRECT_URI;
  }

  setNativeRedirectUri(uri: string): void {
    const trimmed = uri?.trim() ?? '';
    this.nativeRedirectUri.set(trimmed);
    if (trimmed) {
      localStorage.setItem(GDRIVE_NATIVE_REDIRECT_URI_KEY, trimmed);
    } else {
      localStorage.removeItem(GDRIVE_NATIVE_REDIRECT_URI_KEY);
    }
  }

  getRedirectUri(): string {
    if (typeof window === 'undefined') return '';
    if (Capacitor.isNativePlatform()) {
      return this.nativeRedirectUri() || '';
    }
    return window.location.origin;
  }

  private storeFileId(id: string | null): void {
    this.fileId = id;
    if (id) {
      localStorage.setItem(GDRIVE_FILE_ID_KEY, id);
    } else {
      localStorage.removeItem(GDRIVE_FILE_ID_KEY);
    }
  }

  private storeAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      localStorage.setItem(GDRIVE_ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(GDRIVE_ACCESS_TOKEN_KEY);
    }
  }

  private async loadScript(): Promise<void> {
    if (window.google?.accounts?.oauth2?.initTokenClient) {
      return;
    }
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GDRIVE_SCRIPT}"]`);
      if (existing) {
        if (window.google?.accounts?.oauth2?.initTokenClient) {
          resolve();
        } else {
          window.gapiLoad = () => resolve();
        }
        return;
      }
      const script = document.createElement('script');
      script.src = GDRIVE_SCRIPT;
      script.async = true;
      script.onload = () => {
        if (window.google?.accounts?.oauth2?.initTokenClient) {
          resolve();
        } else {
          window.gapiLoad = () => resolve();
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  }

  private initTokenClient(): void {
    const id = this.clientId();
    if (!id || this.tokenClient) return;
    this.tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: id,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          this.lastError.set(response.error);
          this.connectedSignal.set(false);
          this.storeAccessToken(null);
          return;
        }
        this.lastError.set(null);
        this.storeAccessToken(response.access_token);
        this.connectedSignal.set(true);
        this.triggerConfigLoad();
      },
    });
  }

  private triggerConfigLoad(): void {
    this.loadFromDrive().then((json) => {
      if (json && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(GDRIVE_CONFIG_LOADED_EVENT, { detail: json }));
      }
    });
  }

  async connect(): Promise<boolean> {
    const id = this.clientId();
    if (!id.trim()) {
      this.lastError.set('Enter your Google Client ID in settings');
      return false;
    }
    this.lastError.set(null);
    if (this.useRedirectFlow()) {
      const redirectUri = this.getRedirectUri();
      if (!redirectUri || !redirectUri.startsWith('https://')) {
        this.lastError.set('Set Native redirect URL (https) in settings — your app URL + /oauth-redirect');
        return false;
      }
      const verifier = this.randomString(64);
      const challenge = await this.generateCodeChallenge(verifier);
      try {
        sessionStorage.setItem(GDRIVE_CODE_VERIFIER_KEY, verifier);
      } catch {
        this.lastError.set('Storage unavailable');
        return false;
      }
      const params = new URLSearchParams({
        client_id: id,
        redirect_uri: this.getRedirectUri(),
        response_type: 'code',
        scope: DRIVE_SCOPE,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
      });
      window.location.href = `${OAUTH_AUTH_URL}?${params.toString()}`;
      return true;
    }
    try {
      await this.loadScript();
      this.initTokenClient();
      this.tokenClient!.requestAccessToken();
      return true;
    } catch (e) {
      this.lastError.set(e instanceof Error ? e.message : 'Failed to connect');
      return false;
    }
  }

  async tryRestoreSession(): Promise<void> {
    const id = this.clientId();
    if (!id?.trim()) return;
    try {
      await this.loadScript();
      this.initTokenClient();
      if (!this.tokenClient) return;
      this.tokenClient.requestAccessToken({ prompt: 'none' });
    } catch {
      //
    }
  }

  requestTokenSilent(): void {
    this.tokenClient?.requestAccessToken({ prompt: 'none' });
  }

  disconnect(): void {
    if (this.accessToken) {
      window.google?.accounts?.oauth2?.revoke(this.accessToken, () => { });
    }
    this.storeAccessToken(null);
    this.fileId = null;
    this.storeFileId(null);
    this.connectedSignal.set(false);
    this.lastError.set(null);
  }

  async loadFromDrive(): Promise<string | null> {
    if (!this.accessToken) return null;
    const token = this.accessToken;
    let id = this.fileId;
    if (!id) {
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(FILE_NAME)}'%20and%20'root'%20in%20parents&fields=files(id)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (listRes.status === 401) {
        this.connectedSignal.set(false);
        this.storeAccessToken(null);
        return null;
      }
      if (!listRes.ok) return null;
      const list = (await listRes.json()) as { files: { id: string }[] };
      if (!list.files?.length) return null;
      id = list.files[0].id;
      this.fileId = id;
      this.storeFileId(id);
    }
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      this.connectedSignal.set(false);
      this.storeAccessToken(null);
      return null;
    }
    if (!res.ok) return null;
    return res.text();
  }

  saveToDrive(jsonPayload: string): void {
    if (!this.connectedSignal() || !this.accessToken) return;
    this.isSaving.set(true);
    this.doSave(jsonPayload)
      .catch(() => { })
      .finally(() => this.isSaving.set(false));
  }

  private async doSave(jsonPayload: string): Promise<void> {
    if (!this.accessToken) return;
    const token = this.accessToken;
    if (this.fileId) {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonPayload,
      });
      if (res.status === 401) {
        this.connectedSignal.set(false);
        this.storeAccessToken(null);
        return;
      }
      if (!res.ok) {
        this.lastError.set(`Save failed: ${res.status}`);
        return;
      }
      this.lastError.set(null);
      return;
    }
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(FILE_NAME)}'%20and%20'root'%20in%20parents&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (listRes.status === 401) {
      this.connectedSignal.set(false);
      this.storeAccessToken(null);
      return;
    }
    if (!listRes.ok) {
      this.lastError.set(`List failed: ${listRes.status}`);
      return;
    }
    const list = (await listRes.json()) as { files: { id: string }[] };
    if (list.files?.length > 0) {
      this.fileId = list.files[0].id;
      this.storeFileId(this.fileId);
      await this.doSave(jsonPayload);
      return;
    }
    const boundary = 'part-manager-boundary-' + Date.now();
    const metadata = JSON.stringify({ name: FILE_NAME, parents: ['root'] });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonPayload}\r\n--${boundary}--`;
    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (createRes.status === 401) {
      this.connectedSignal.set(false);
      this.storeAccessToken(null);
      return;
    }
    if (!createRes.ok) {
      this.lastError.set(`Create failed: ${createRes.status}`);
      return;
    }
    const created = (await createRes.json()) as { id: string };
    this.fileId = created.id;
    this.storeFileId(this.fileId);
    this.lastError.set(null);
  }
}
