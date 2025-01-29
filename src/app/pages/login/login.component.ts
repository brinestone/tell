import { Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Title } from '@angular/platform-browser';
import { Divider } from 'primeng/divider';
import { GoogleButton } from '../../components/google-button.component';
import { environment } from '../../../environments/environment.development';
import { dispatch } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { GoogleSignInFlow } from '../../state/user';

@Component({
  selector: 'tm-login',
  imports: [
    Card,
    Divider,
    GoogleButton
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly title = inject(Title);
  readonly route = inject(ActivatedRoute);
  private readonly beginGoogleFlow = dispatch(GoogleSignInFlow);

  onGoogleButtonClicked() {
    const continueTo = this.route.snapshot.queryParams['continue'] ?? '/';
    this.beginGoogleFlow(`${environment.apiOrigin}`, continueTo);
  }

}
