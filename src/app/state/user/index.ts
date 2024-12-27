import { Action, createSelector, provideStates, State, StateContext, StateToken } from '@ngxs/store';
import { EnvironmentProviders, Injectable } from '@angular/core';
import { FinishGoogleSignInFlow, GoogleSignInFlow } from './actions';
import { jwtDecode } from 'jwt-decode';
import { throwError } from 'rxjs';
import { patch } from '@ngxs/store/operators';
import { Navigate } from '@ngxs/router-plugin';


export * from './actions';

export type Principal = {
  displayName: string;
  email: string;
  userId: number;
  avatar?: string;
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
class UserState {

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
}

export function provideUserState(...providers: EnvironmentProviders[]) {
  return provideStates([UserState], ...providers);
}

export const isUserSignedIn = createSelector([USER], state => state.signedIn);
