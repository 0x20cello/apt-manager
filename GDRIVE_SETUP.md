# Google Drive backup

Data is saved to **part-manager.json** in your Google Drive root. After connecting, every save in the app syncs to that file in the background.

## Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable **Google Drive API**: APIs & Services → Library → search "Google Drive API" → Enable.
4. Configure OAuth consent: APIs & Services → OAuth consent screen → External (or Internal) → fill app name and support email → Save.
5. Create credentials: APIs & Services → Credentials → Create credentials → OAuth client ID.
6. Application type: **Web application** (one client for both browser and native).
7. Add **Authorized JavaScript origins**: e.g. `http://localhost:4200` for dev, your production origin (e.g. `https://yourapp.com`) for prod. Use the exact origin (no trailing slash).
8. Add **Authorized redirect URIs** (same Web application client) — Google accepts only **http** or **https** (custom schemes are rejected). Must match exactly or you get **Error 400: redirect_uri_mismatch**:
   - **Browser**: Your app origin, e.g. `http://localhost:4200` for dev and your production origin for prod. The app shows the current redirect URI in the Google Drive modal; copy that value into the OAuth client.
   - **Native (Capacitor)**: Use an **https** URL only (Google rejects custom schemes). Deploy your app so it is reachable at e.g. `https://yourdomain.com`. Add `https://yourdomain.com/oauth-redirect` to Authorized redirect URIs. In the app, set **Native redirect URL** to that same https URL. The `/oauth-redirect` page then redirects back to the app.
9. Copy the **Client ID** (e.g. `xxx.apps.googleusercontent.com`).
10. **Add test users** (required while the app is in Testing): APIs & Services → OAuth consent screen → scroll to **Test users** → **Add users** → add the Google account(s) that will use the app. Without this, you get "Access blocked" / 403 access_denied.
11. In the app: Data Management → Google Drive → paste the Client ID → **Connect Google Drive**.
12. Authorize (popup on web, redirect on mobile). Native uses the authorization code flow with PKCE to comply with Google OAuth 2.0 policy. After that, saves will sync to Drive automatically.

Access tokens expire after about an hour. If sync stops, open Google Drive settings again; the app will try to reconnect silently if you still have a Google session.
