import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, Injectable } from '@angular/core';
import { PaymentMethodLookup } from '@lib/models/payment-method-lookup';
import { AccessTokenClaimsSchema, DisplayPrefs, RefreshTokenClaimsSchema, UserPrefs } from '@lib/models/user';
import { Navigate } from '@ngxs/router-plugin';
import {
  Action,
  createPropertySelectors,
  createSelector, NgxsOnInit,
  provideStates,
  State,
  StateContext,
  StateToken
} from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { jwtDecode } from 'jwt-decode';
import { catchError, map, tap, throwError } from 'rxjs';
import { z } from 'zod';
import { FinishGoogleSignInFlow, GoogleSignInFlow, PrefsUpdated, RefreshAccessToken, RefreshPaymentMethod, SetColorMode, SignedIn, SignOut, UpdatePrefs } from './actions';

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

@State({
  name: USER,
  defaults: defaultState
})
@Injectable()
class UserState implements NgxsOnInit {
  private http = inject(HttpClient);

  @Action(RefreshAccessToken)
  onRefreshAccessToken(ctx: Context) {
    const { refreshToken } = ctx.getState();
    return this.http.get<{ access: string, refresh: string }>('/api/auth/refresh', { params: { token: refreshToken ?? '' } }).pipe(
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
      })
    )
  }

  @Action(RefreshPaymentMethod)
  onRefreshPaymentMethod(ctx: Context) {
    return this.http.get<PaymentMethodLookup[]>('/api/payment/methods').pipe(
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
    return this.http.put('/api/users/prefs', action).pipe(
      tap(() => ctx.dispatch(PrefsUpdated)),
      catchError((e: Error) => {
        ctx.setState(patch({
          prefs: backup
        }));
        return throwError(() => e);
      })
    );
  }

  @Action(SignedIn)
  @Action(PrefsUpdated)
  onUserSignedIn(ctx: Context) {
    return this.http.get<UserPrefs>('/api/users/prefs').pipe(
      tap(prefs => {
        ctx.setState(patch({ prefs }));
      })
    )
  }

  @Action(SignOut)
  signOut(ctx: Context, { redirect }: SignOut) {
    ctx.setState(defaultState);
    ctx.dispatch(new Navigate([redirect ?? '/']));
    location.reload();
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

    const redirect = localStorage.getItem('auth-redirect');
    localStorage.removeItem('auth-redirect');
    ctx.dispatch([SignedIn, new Navigate([redirect ?? '/'])]);
  }

  ngxsOnInit(ctx: Context) {
    const { accessToken: token } = ctx.getState();
    if (!token) return;
    const { exp } = jwtDecode(token);
    const now = Date.now();
    if (now > Number(exp) * 1000) {
      ctx.setState(defaultState);
      location.reload();
    }
  }
}

export function provideUserState(...providers: EnvironmentProviders[]) {
  return provideStates([UserState], ...providers);
}

const slices = createPropertySelectors(USER);

export const isUserSignedIn = createSelector([USER], state => state?.signedIn);
export const principal = slices.principal;
export const accessToken = slices.accessToken;
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
