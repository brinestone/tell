import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    title: 'Sign in to your Account',
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'oauth2/callback',
    loadComponent: () => import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  }
];
