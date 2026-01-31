import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { NATIVE_APP_SCHEME } from '../../services/google-drive.service';

@Component({
  selector: 'app-oauth-redirect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oauth-redirect">
      <p>Redirecting to app…</p>
    </div>
  `,
  styles: [`
    .oauth-redirect {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: inherit;
      color: var(--color-text-secondary);
    }
  `],
})
export class OAuthRedirectComponent implements OnInit {
  ngOnInit(): void {
    const q = typeof window !== 'undefined' ? window.location.search : '';
    const target = `${NATIVE_APP_SCHEME}://localhost${q || ''}`;
    if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  }
}
