import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsRouterPlugin, } from '@ngxs/router-plugin';
import { SESSION_STORAGE_ENGINE, withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { provideStore } from '@ngxs/store';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { accessTokenInterceptor } from './interceptors/access-token.interceptor';
import { USER, UserState } from './state/user';
export const AutoThemePreset = definePreset(Aura);
export const ManualThemePreset = definePreset(Aura);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([accessTokenInterceptor])),
    provideStore([UserState],
      withNgxsStoragePlugin({ keys: [{ key: USER, engine: SESSION_STORAGE_ENGINE }] }),
      withNgxsLoggerPlugin({ disabled: !isDevMode() }),
      withNgxsRouterPlugin(),
      withNgxsReduxDevtoolsPlugin({ disabled: !isDevMode() })),
    providePrimeNG({
      theme: {
        preset: AutoThemePreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    })
  ]
};
