import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, Injectable } from '@angular/core';
import { PaymentMethodLookup } from '@lib/models/payment-method-lookup';
import { DisplayPrefs, UserPrefs } from '@lib/models/user';
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
import { catchError, tap, throwError } from 'rxjs';
import { FinishGoogleSignInFlow, GoogleSignInFlow, PrefsUpdated, RefreshPaymentMethod, SetColorMode, SignedIn, SignOut, UpdatePrefs } from './actions';

export * from './actions';

export type Principal = {
  name: string;
  email: string;
  sub: number;
  image?: string;
}

export type UserStateModel = {
  token?: string;
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

@State({
  name: USER,
  defaults: defaultState
})
@Injectable()
class UserState implements NgxsOnInit {
  private http = inject(HttpClient);

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
  finishGoogleSignInFlow(ctx: Context, { accessToken }: FinishGoogleSignInFlow) {
    try {
      const data = jwtDecode<Principal>(accessToken);
      ctx.setState(patch({
        signedIn: true,
        principal: data,
        token: accessToken
      }));
      const redirect = localStorage.getItem('auth-redirect');
      localStorage.removeItem('auth-redirect');
      ctx.dispatch([SignedIn, new Navigate([redirect ?? '/'])]);
    } catch (error) {
      ctx.setState(defaultState);
      console.error(error);
      throw error;
    }
  }

  ngxsOnInit(ctx: Context) {
    const { token } = ctx.getState();
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
export const accessToken = slices.token;
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
