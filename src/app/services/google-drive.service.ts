import { Injectable, signal } from '@angular/core';

const GDRIVE_SCRIPT = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'part-manager.json';
const GDRIVE_FILE_ID_KEY = 'gdrive-file-id';
const GDRIVE_CLIENT_ID_KEY = 'gdrive-client-id';
const DEFAULT_CLIENT_ID = '838239311300-ji616dlcecp6upb9417t6jf0agqh7mt0.apps.googleusercontent.com';

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
  private accessToken: string | null = null;
  private tokenClient: TokenClient | null = null;
  private fileId: string | null = this.loadFileId();
  private connectedSignal = signal<boolean>(false);

  readonly connected = this.connectedSignal.asReadonly();
  readonly clientId = signal<string>(this.loadClientId());
  readonly lastError = signal<string | null>(null);
  readonly isSaving = signal<boolean>(false);

  private loadFileId(): string | null {
    return localStorage.getItem(GDRIVE_FILE_ID_KEY);
  }

  private loadClientId(): string {
    return localStorage.getItem(GDRIVE_CLIENT_ID_KEY) ?? DEFAULT_CLIENT_ID;
  }

  setClientId(id: string): void {
    this.clientId.set(id);
    if (id) {
      localStorage.setItem(GDRIVE_CLIENT_ID_KEY, id);
    } else {
      localStorage.removeItem(GDRIVE_CLIENT_ID_KEY);
    }
  }

  private storeFileId(id: string | null): void {
    this.fileId = id;
    if (id) {
      localStorage.setItem(GDRIVE_FILE_ID_KEY, id);
    } else {
      localStorage.removeItem(GDRIVE_FILE_ID_KEY);
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
          return;
        }
        this.lastError.set(null);
        this.accessToken = response.access_token;
        this.connectedSignal.set(true);
      },
    });
  }

  async connect(): Promise<boolean> {
    const id = this.clientId();
    if (!id.trim()) {
      this.lastError.set('Enter your Google Client ID in settings');
      return false;
    }
    this.lastError.set(null);
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
      window.google?.accounts?.oauth2?.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    this.fileId = null;
    this.storeFileId(null);
    this.connectedSignal.set(false);
    this.lastError.set(null);
  }

  saveToDrive(jsonPayload: string): void {
    if (!this.connectedSignal() || !this.accessToken) return;
    this.isSaving.set(true);
    this.doSave(jsonPayload)
      .catch(() => {})
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
        this.accessToken = null;
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
      this.accessToken = null;
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
      this.accessToken = null;
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
