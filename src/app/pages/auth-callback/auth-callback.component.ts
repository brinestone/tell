import { Component, effect, signal } from '@angular/core';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { dispatch } from '@ngxs/store';
import { Navigate } from '@ngxs/router-plugin';
import { switchMap, timer } from 'rxjs';
import { FinishGoogleSignInFlow } from '../../state/user';

@Component({
  selector: 'tm-auth-callback',
  imports: [],
  template: `
    <p>
      @if (failed()) {
        Login failed. Redirecting to sign in page.
      } @else {
        Redirecting...
      }
    </p>
  `,
  styleUrl: './auth-callback.component.scss'
})
export class AuthCallbackComponent {
  private accessToken = injectQueryParams('access_token');
  readonly failed = signal(false);
  private navigate = dispatch(Navigate);
  private finishFlow = dispatch(FinishGoogleSignInFlow);

  constructor() {
    effect(() => {
      const token = this.accessToken();
      if (!token) {
        this.failed.set(true);
        timer(5000).pipe(
          switchMap(() => this.navigate(['/auth/login'], undefined, { queryParamsHandling: 'preserve' }))
        ).subscribe()
      } else {
        timer(5000).pipe(
          switchMap(() => this.finishFlow(token)),
        ).subscribe();
      }
    });
  }
}
