import { HttpInterceptorFn } from '@angular/common/http';
import { inject }            from '@angular/core';
import { Store }             from '@ngxs/store';
import { accessToken }       from '../state/user';

export const accessTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const token = store.selectSnapshot(accessToken);

  if (req.url.startsWith('/api') && token) {
    return next(req.clone({ setHeaders: { 'Authorization': `Bearer ${token}` } }));
  }
  return next(req);
};
