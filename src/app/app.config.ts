import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideStore } from '@ngxs/store'
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin'
import { withNgxsRouterPlugin, } from '@ngxs/router-plugin'
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { accessTokenInterceptor } from './interceptors/access-token.interceptor';
import { definePreset } from '@primeng/themes';
export const AutoThemePreset = definePreset(Aura);

export const ManualThemePreset = definePreset(Aura,)

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([accessTokenInterceptor])),
    provideStore([],
      withNgxsStoragePlugin({ keys: [] }),
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
