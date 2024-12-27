import { Component } from '@angular/core';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { dispatch, select } from '@ngxs/store';
import { principal, SignOut } from '../../state/user';
import { Avatar } from 'primeng/avatar';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'tm-home',
  imports: [
    Menubar,
    Avatar,
    Menu
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly signOut = dispatch(SignOut);
  readonly principal = select(principal);
  readonly menuItems: MenuItem[] = [
    { label: 'Home', routerLink: '/', icon: 'pi pi-home', routerLinkActiveOptions: { match: true } },
  ];
  readonly userMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/auth/profile' },
    { separator: true },
    {
      label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.signOut()
    },
  ]
}
