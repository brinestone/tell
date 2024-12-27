import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: (redirect: string) => CanActivateFn = (redirect: string) => (route, state) => {
  const router = inject(Router);
  console.log(document.cookie);
  return router.parseUrl(`${redirect}?continue=${encodeURIComponent(state.url)}`);
};
