import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { provideUserState, USER } from './state/user';
import { SESSION_STORAGE_ENGINE, withStorageFeature } from '@ngxs/storage-plugin';

const userState = provideUserState(withStorageFeature([
  { key: USER, engine: SESSION_STORAGE_ENGINE }
]));

export const appRoutes: Routes = [
  {
    providers: [userState],
    path: 'auth',
    loadChildren: () => import('./auth.routes').then(m => m.authRoutes)
  },
  {
    providers: [userState],
    canActivate: [authGuard('/auth/login')],
    title: 'Home',
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  }
];
