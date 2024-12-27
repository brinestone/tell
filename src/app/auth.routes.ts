import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    title: 'Sign in to your Account',
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  }
];
