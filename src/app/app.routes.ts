import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';


const signedInGuard = authGuard('/auth/login');

export const appRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'campaigns',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/campaigns/campaigns.component').then(m => m.CampaignsComponent),
    title: 'Campaigns'
  },
  {
    canActivate: [signedInGuard],
    title: 'Dashboard',
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    canActivate: [signedInGuard],
    title: 'Wallets',
    path: 'wallet',
    loadComponent: () => import('./pages/wallet/wallet.component').then(m => m.WalletComponent),
  },
  {
    canActivate: [signedInGuard],
    title: 'Settings',
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '', pathMatch: 'full', redirectTo: 'campaigns'
  },
  { path: '**', component: NotFoundComponent, title: '404 - Resource not found' }
];
