import { Location } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment.development';
import {
  PaymentMethodLookup
} from '@lib/models/payment-method-lookup';
import { AccessTokenClaimsSchema, DisplayPrefs, RefreshTokenClaimsSchema, UserPrefs } from '@lib/models/user';
import { Navigate } from '@ngxs/router-plugin';
import {
  Action,
  createPropertySelectors,
  createSelector, NgxsOnInit,
  State,
  StateContext,
  StateToken,
  Store
} from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { EventSource } from 'eventsource';
import { jwtDecode } from 'jwt-decode';
import { catchError, EMPTY, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { z } from 'zod';
import {
  FinishGoogleSignInFlow,
  GoogleSignInFlow,
  PrefsUpdated,
  RefreshAccessToken,
  RefreshPaymentMethod,
  SetColorMode,
  SignedIn,
  SignedOut,
  SignOut,
  UpdatePrefs,
  WalletBalanceUpdated
} from './actions';

export * from './actions';

const PrincipalSchema = AccessTokenClaimsSchema.pick({
  email: true,
  image: true,
  name: true,
  sub: true,
});

export type Principal = z.infer<typeof PrincipalSchema>;

export type UserStateModel = {
  accessToken?: string;
  refreshToken?: string;
  signedIn: boolean;
  principal?: Principal;
  prefs?: UserPrefs;
  paymentMethods: PaymentMethodLookup[]
}

export const USER = new StateToken<UserStateModel>('user');
const defaultDisplayPrefs = {
  country: 'CM',
  currency: 'XAF',
  language: 'en',
  theme: 'light'
} as DisplayPrefs;
const defaultState: UserStateModel = { signedIn: false, paymentMethods: [] };

type Context = StateContext<UserStateModel>;

export const ParamsSchema = z.object({
  access: z.string()
    .transform(t => jwtDecode(t))
    .pipe(AccessTokenClaimsSchema),
  refresh: z.string()
    .transform(t => jwtDecode(t))
    .pipe(RefreshTokenClaimsSchema)
});

class FatalError extends Error { }
class RetriableError extends Error { }

@State({
  name: USER,
  defaults: defaultState
})
@Injectable()
export class UserState implements NgxsOnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private location = inject(Location);
  private eventsource?: EventSource;
  private store = inject(Store);

  @Action(SignedOut)
  closeUpdates(ctx: Context) {
    this.eventsource?.close();
    this.eventsource = undefined;
  }

  @Action(SignedIn)
  receiveUpdates() {
    if (this.eventsource) return;
    setTimeout(async () => {
      const eventsource = new EventSource(new URL(`/updates`, environment.apiOrigin), {
        fetch: (input, init) => {
          const token = this.store.selectSnapshot(accessToken);
          return fetch(input, {
            ...init, headers: {
              authorization: `Bearer ${token}`
            }
          });
        }
      });

      eventsource.onerror = (event) => {
        if (event.code === 401) {
          this.store.dispatch(new RefreshAccessToken()).subscribe(() => {
            this.receiveUpdates();
          });
          return;
        }
        console.error(event);
      }

      eventsource.onmessage = ({ data }) => {
        const { event } = JSON.parse(data) as { event: string, data?: any };
        switch (event) {
          case 'balance.update':
            this.store.dispatch(WalletBalanceUpdated);
            break;
          case 'prefs.update':
            this.store.dispatch(PrefsUpdated);
            break;
        }
      }
    });
  }

  @Action(SignedOut)
  refreshOnSignedOut(_: Context, { redirect }: SignedOut) {
    this.location.go(redirect ?? '/');
    window.location.reload();
  }

  @Action(RefreshAccessToken)
  onRefreshAccessToken(ctx: Context) {
    const { refreshToken } = ctx.getState();
    return this.http.get<{
      access: string,
      refresh: string
    }>(environment.apiOrigin + '/auth/refresh', { params: { token: refreshToken ?? '' } }).pipe(
      map(arg => ({
        ...ParamsSchema.parse(arg),
        accessToken: arg.access,
        refreshToken: arg.refresh
      })),
      tap(({ access, accessToken, refreshToken }) => {
        return ctx.setState(patch({
          refreshToken,
          accessToken,
          principal: PrincipalSchema.parse(access)
        }));
      }),
      catchError(() => {
        ctx.dispatch(new SignOut(this.router.url));
        return EMPTY;
      })
    )
  }

  @Action(RefreshPaymentMethod)
  onRefreshPaymentMethod(ctx: Context) {
    return this.http.get<PaymentMethodLookup[]>(environment.apiOrigin + '/payment/methods').pipe(
      tap(paymentMethods => ctx.setState(patch({
        paymentMethods
      })))
    );
  }

  @Action(SignedIn)
  updatePaymentMethodsOnSignIn(ctx: Context) {
    ctx.dispatch(RefreshPaymentMethod);
  }

  @Action(SetColorMode, { cancelUncompleted: true })
  onSetColorMode(ctx: Context, { mode }: SetColorMode) {
    const { prefs } = ctx.getState();
    ctx.dispatch(new UpdatePrefs(mode, prefs?.country ?? '', prefs?.currency ?? '', prefs?.language ?? ''));
  }

  @Action(UpdatePrefs, { cancelUncompleted: true })
  onUpdatePrefs(ctx: Context, action: UpdatePrefs) {
    const { prefs: backup } = ctx.getState();
    ctx.setState(patch({
      prefs: patch({
        country: action.country || defaultDisplayPrefs.country,
        theme: action.theme || defaultDisplayPrefs.theme,
        language: action.language || defaultDisplayPrefs.language,
        currency: action.currency || defaultDisplayPrefs.currency
      })
    }));
    return this.http.patch(environment.apiOrigin + '/users/prefs', action).pipe(
      catchError((e: Error) => {
        ctx.setState(patch({
          prefs: backup
        }));
        return throwError(() => e);
      })
    );
  }

  @Action(SignedIn)
  @Action(PrefsUpdated, { cancelUncompleted: true })
  onUserSignedIn(ctx: Context) {
    return this.http.get<UserPrefs>(environment.apiOrigin + '/users/prefs').pipe(
      tap(prefs => {
        ctx.setState(patch({ prefs }));
      })
    )
  }

  @Action(SignOut)
  signOut(ctx: Context, action: SignOut): Observable<never> {
    const { refreshToken } = ctx.getState();
    if (!refreshToken) {
      ctx.setState(defaultState);
      ctx.dispatch([SignedOut, new Navigate([action.redirect ?? '/'])]);
      return EMPTY;
    }

    return this.http.get(`${environment.apiOrigin}/auth/revoke-token`, {
      params: {
        token: refreshToken
      }
    }).pipe(
      tap(() => {
        ctx.setState(defaultState);
        ctx.dispatch([SignedOut, new Navigate([action.redirect ?? '/'])]);
      }),
      switchMap(() => EMPTY),
      catchError((e: HttpErrorResponse) => {
        if (e.status == 401 || e.status == 403) {
          ctx.setState(defaultState);
          ctx.dispatch([SignedOut, new Navigate([action.redirect ?? '/'])]);
          return EMPTY;
        }
        return this.signOut(ctx, action);
      })
    );
  }

  @Action(GoogleSignInFlow)
  googleSignInFlow(_: Context, { redirect, apiBase }: GoogleSignInFlow) {
    localStorage.setItem('auth-redirect', redirect);
    location.href = `${apiBase}/auth/google`;
  }

  @Action(FinishGoogleSignInFlow)
  finishGoogleSignInFlow(ctx: Context, { accessToken, refreshToken, accessClaims }: FinishGoogleSignInFlow) {
    ctx.setState(patch({
      signedIn: true,
      principal: PrincipalSchema.parse(accessClaims),
      accessToken,
      refreshToken
    }));

    const redirect = this.router.parseUrl(localStorage.getItem('auth-redirect') ?? '/');
    localStorage.removeItem('auth-redirect');

    ctx.dispatch([SignedIn]);
    this.router.navigateByUrl(redirect);
  }

  ngxsOnInit(ctx: Context) {
    const { accessToken: token } = ctx.getState();
    if (!token) return;
    const { exp } = jwtDecode(token);
    const now = Date.now();
    if (now > Number(exp) * 1000) {
      ctx.setState(defaultState);
      location.reload();
      return;
    }
    this.receiveUpdates();
  }
}

// export function provideUserState(...providers: EnvironmentProviders[]) {
//   return provideStates([UserState], ...providers);
// }

const slices = createPropertySelectors(USER);

export const isUserSignedIn = createSelector([USER], state => state?.signedIn);
export const principal = slices.principal;
export const accessToken = slices.accessToken;
export const refreshToken = slices.refreshToken;
export const accessTokenExpired = createSelector([slices.accessToken], t => {
  if (!t) return true;
  const { exp } = jwtDecode(t);
  const now = Date.now();
  const then = Number(exp);
  if (isNaN(then)) return true;
  const ans = now > (then * 1000);

  return ans;
});
export const refreshTokenExpired = createSelector([slices.refreshToken], t => {
  if (!t) return true;
  const { exp } = jwtDecode(t);
  const now = Date.now();
  const then = Number(exp);
  if (isNaN(then)) return true;

  const ans = now > (then * 1000);
  return ans;
})
export const preferences = createSelector([slices.prefs], prefs => {
  if (!prefs) {
    return defaultDisplayPrefs;
  }

  const { country, currency, language, theme } = prefs;
  return { country, currency, language, theme };
});
export const preferredLanguage = createSelector([preferences], ({ language }) => {
  return language;
})
export const darkMode = createSelector([preferences], ({ theme }) => theme == 'dark')
export const paymentMethods = slices.paymentMethods;
export const pmMomo = createSelector([paymentMethods], (methods) => {
  return methods.find(({ provider }) => provider == 'momo');
})
