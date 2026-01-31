# Google Drive backup

Data is saved to **part-manager.json** in your Google Drive root. After connecting, every save in the app syncs to that file in the background.

## Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable **Google Drive API**: APIs & Services → Library → search "Google Drive API" → Enable.
4. Configure OAuth consent: APIs & Services → OAuth consent screen → External (or Internal) → fill app name and support email → Save.
5. Create credentials: APIs & Services → Credentials → Create credentials → OAuth client ID.
6. Application type: **Web application**.
7. Add authorized JavaScript origins (e.g. `http://localhost:4200` for dev, your production URL for prod).
8. Copy the **Client ID** (e.g. `xxx.apps.googleusercontent.com`).
9. **Add test users** (required while the app is in Testing): APIs & Services → OAuth consent screen → scroll to **Test users** → **Add users** → add the Google account(s) that will use the app (e.g. your email). Without this, you get "Access blocked" / 403 access_denied.
10. In the app: Data Management → Google Drive → paste the Client ID → **Connect Google Drive**.
11. Authorize in the popup. After that, saves will sync to Drive automatically.

Access tokens expire after about an hour. If sync stops, open Google Drive settings again; the app will try to reconnect silently if you still have a Google session.
