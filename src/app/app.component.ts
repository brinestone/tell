import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { select } from '@ngxs/store';
import { dt, updatePreset, usePreset } from '@primeng/themes';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { map } from 'rxjs';
import { AutoThemePreset, ManualThemePreset } from './app.config';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { isUserSignedIn, preferences } from './state/user';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'tm-root',
  imports: [RouterOutlet, TopBarComponent, Toast, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [MessageService]
})
export class AppComponent {
  readonly isSmallDisplay = inject(BreakpointObserver).observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape]).pipe(map(({ matches }) => matches))
  readonly isSignedIn = select(isUserSignedIn);
  private readonly prefs = select(preferences);
  constructor(meta: Meta) {
    let tag = meta.addTag({ name: 'theme-color' });
    effect(() => {
      const doc = document.querySelector('html') as HTMLHtmlElement;
      const { theme } = this.prefs();
      let colorMode: '.app-dark' | 'system' | 'none' = '.app-dark';
      if (theme == 'system') {
        usePreset(AutoThemePreset);
      } else {
        updatePreset(ManualThemePreset);
      }

      switch (theme) {
        case 'dark':
          doc.classList.add('app-dark');
          colorMode = '.app-dark';
          break;
        case 'light':
          doc.classList.remove('app-dark');
          break;
        default:
      }

      if (tag) {
        tag.content = getComputedStyle(document.getElementsByTagName('html')[0]).getPropertyValue('--p-primary-color');
      }
    })
  }
}
