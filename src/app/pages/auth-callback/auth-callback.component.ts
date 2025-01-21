import { Component, effect, signal } from '@angular/core';
import { Navigate } from '@ngxs/router-plugin';
import { dispatch } from '@ngxs/store';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { switchMap, timer } from 'rxjs';
import { FinishGoogleSignInFlow, ParamsSchema } from '../../state/user';

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
  private params = injectQueryParams();
  readonly failed = signal(false);
  private navigate = dispatch(Navigate);
  private finishFlow = dispatch(FinishGoogleSignInFlow);

  constructor() {
    effect(() => {
      const params = this.params();
      const { success, data } = ParamsSchema.safeParse(params);
      if (!success) {
        this.failed.set(true);
        timer(5000).pipe(
          switchMap(() => this.navigate(['/auth/login'], undefined, { queryParamsHandling: 'preserve' }))
        ).subscribe()
      } else {
        const { access, refresh } = data;
        timer(5000).pipe(
          switchMap(() => this.finishFlow(String(params['access']), String(params['refresh']), access, refresh)),
        ).subscribe();
      }
    });
  }
}
