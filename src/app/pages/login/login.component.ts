import { Component, HostListener, inject, OnInit, output } from '@angular/core';
import { Card } from 'primeng/card';
import { Title } from '@angular/platform-browser';
import { Divider } from 'primeng/divider';
import { GoogleButton } from '../../components/google-button.component';
import { environment } from '../../../environments/environment.development';

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
export class LoginComponent implements OnInit{
  readonly title = inject(Title);
  onGoogleButtonClicked() {
    location.href = `${environment.apiOrigin}/api/auth/google`
  }

  ngOnInit() {
    console.log(document.cookie);
  }
}
