import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { isUserSignedIn } from '../state/user';

export const authGuard: (redirect: string) => CanActivateFn = (redirect: string) => (route, state) => {
  const router = inject(Router);
  const isSignedIn = inject(Store).selectSnapshot(isUserSignedIn);
  return isSignedIn ? true : router.parseUrl(`${redirect}?continue=${encodeURIComponent(state.url)}`);
};
