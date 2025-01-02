import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe }                       from '@angular/common';
import { Component, inject }               from '@angular/core';
import { RouterOutlet }                    from '@angular/router';
import { select }                          from '@ngxs/store';
import { MessageService }                  from 'primeng/api';
import { Toast }                           from 'primeng/toast';
import { map }                             from 'rxjs';
import { TopBarComponent }                 from './components/top-bar/top-bar.component';
import { isUserSignedIn }                  from './state/user';

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
