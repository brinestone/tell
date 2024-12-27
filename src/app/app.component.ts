import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { select } from '@ngxs/store';
import { isUserSignedIn } from './state/user';
import { TopBarComponent } from './components/top-bar/top-bar.component';

@Component({
  selector: 'tm-root',
  imports: [RouterOutlet, TopBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly isSignedIn = select(isUserSignedIn);
}
