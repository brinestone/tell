import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { provideUserState, USER } from './state/user';
import { SESSION_STORAGE_ENGINE, withStorageFeature } from '@ngxs/storage-plugin';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const userState = provideUserState(withStorageFeature([
  { key: USER, engine: SESSION_STORAGE_ENGINE }
]));

const signedInGuard = authGuard('/auth/login');

export const appRoutes: Routes = [
  {
    providers: [userState],
    path: 'auth',
    loadChildren: () => import('./auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'campaigns',
    canActivate: [signedInGuard],
    providers: [userState],
    loadComponent: () => import('./pages/campaigns/campaigns.component').then(m => m.CampaignsComponent),
    title: 'Campaigns'
  },
  {
    providers: [userState],
    canActivate: [signedInGuard],
    title: 'Dashboard',
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    providers: [userState],
    canActivate: [signedInGuard],
    title: 'Wallet',
    path: 'wallet',
    loadComponent: () => import('./pages/wallet/wallet.component').then(m => m.WalletComponent),
  },
  {
    providers: [userState],
    canActivate: [signedInGuard],
    title: 'Settings',
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '**', component: NotFoundComponent, title: '404 - Resource not found' }
];
