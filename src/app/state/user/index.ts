import {
  Action,
  createPropertySelectors,
  createSelector, NgxsOnInit,
  provideStates,
  State,
  StateContext,
  StateToken
}                                                            from '@ngxs/store';
import { EnvironmentProviders, Injectable }                  from '@angular/core';
import { FinishGoogleSignInFlow, GoogleSignInFlow, SignOut } from './actions';
import { jwtDecode }                                         from 'jwt-decode';
import { patch }                                             from '@ngxs/store/operators';
import { Navigate }                                          from '@ngxs/router-plugin';

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
}

export const USER = new StateToken<UserStateModel>('user');
const defaultState: UserStateModel = { signedIn: false }

type Context = StateContext<UserStateModel>;

@State({
  name: USER,
  defaults: defaultState
})
@Injectable()
class UserState implements NgxsOnInit {

  @Action(SignOut)
  signOut(ctx: Context) {
    ctx.setState(defaultState);
    ctx.dispatch(new Navigate(['/']));
    location.reload();
  }

  @Action(GoogleSignInFlow)
  googleSignInFlow(ctx: Context, { redirect, apiBase }: GoogleSignInFlow) {
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
      ctx.dispatch(new Navigate([redirect ?? '/']));
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
    if (now > Number(exp)*1000) {
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
