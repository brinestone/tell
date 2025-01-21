import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { catchError, map, of } from 'rxjs';
import { accessToken, accessTokenExpired, RefreshAccessToken } from '../state/user';

export const authGuard: (redirect: string) => CanActivateFn = (redirect: string) => (route, state) => {
  const router = inject(Router);
  const store = inject(Store);
  const token = store.selectSnapshot(accessToken);
  const tokenExpired = store.selectSnapshot(accessTokenExpired);
  const fallback = router.parseUrl(`${redirect}?continue=${encodeURIComponent(state.url)}`);

  if (!token) {
    return fallback;
  } else if (tokenExpired) {
    return store.dispatch(RefreshAccessToken).pipe(
      map(() => true),
      catchError(() => of(fallback))
    );
  }
  return true;
};
