import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  { path: 'auth', loadChildren: () => import('./auth.routes').then(m => m.authRoutes) },
  {
    canActivate: [authGuard('/auth/login')],
    title: 'Home',
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  }
];
