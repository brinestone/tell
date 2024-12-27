import { Component }          from '@angular/core';
import { Menubar }            from 'primeng/menubar';
import { MenuItem }           from 'primeng/api';
import { dispatch, select }   from '@ngxs/store';
import { principal, SignOut } from '../../state/user';
import { Avatar }             from 'primeng/avatar';
import { Menu }               from 'primeng/menu';

@Component({
  selector: 'tm-top-bar',
  imports: [
    Menubar,
    Avatar,
    Menu
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  private readonly signOut = dispatch(SignOut);
  readonly principal = select(principal);
  readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', routerLink: '/', icon: 'pi pi-gauge', routerLinkActiveOptions: { match: true } },
    {
      label: 'Posts', icon: 'pi pi-list', routerLink: '/posts', routerLinkActiveOptions: { match: true }
    },
    { label: 'Wallet', icon: 'pi pi-wallet', routerLink: '/wallet', routerLinkActiveOptions: { match: true } },
  ];
  readonly userMenuItems: MenuItem[] = [
    { label: 'Settings', icon: 'pi pi-cog', routerLink: '/settings' },
    { separator: true },
    {
      label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.signOut()
    },
  ]
}
