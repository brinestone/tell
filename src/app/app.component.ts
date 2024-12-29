import { Component, inject }               from '@angular/core';
import { RouterOutlet }                    from '@angular/router';
import { select }                          from '@ngxs/store';
import { isUserSignedIn }                  from './state/user';
import { TopBarComponent }                 from './components/top-bar/top-bar.component';
import { Toast }                           from 'primeng/toast';
import { MessageService }                  from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map }                             from 'rxjs';
import { AsyncPipe }                       from '@angular/common';

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
}
