import { NgClass } from '@angular/common';
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { dispatch, select } from '@ngxs/store';
import { MenuItem, MessageService } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { ToggleSwitchChangeEvent, ToggleSwitchModule } from 'primeng/toggleswitch';
import { preferences, principal, SetColorMode, SignOut } from '../../state/user';

@Component({
  selector: 'tm-top-bar',
  imports: [
    Menubar,
    Avatar,
    ToggleSwitchModule,
    Menu,
    NgClass,
    FormsModule
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  private messageService = inject(MessageService);
  private readonly signOut = dispatch(SignOut);
  readonly principal = select(principal);
  readonly preferences = select(preferences);
  private updateMode = dispatch(SetColorMode);
  readonly updatingMode = signal(false);
  readonly darkMode = linkedSignal(() => this.preferences().theme == 'dark');
  readonly menuItems: MenuItem[] = [
    // { label: 'Dashboard', routerLink: '/', icon: 'pi pi-gauge', routerLinkActiveOptions: { match: true } },
    {
      label: 'Campaigns', icon: 'pi pi-list', routerLink: '/campaigns', routerLinkActiveOptions: { match: true }
    },
    { label: 'Wallets', icon: 'pi pi-wallet', routerLink: '/wallet', routerLinkActiveOptions: { match: true } },
  ];
  readonly userMenuItems: MenuItem[] = [
    { label: 'Settings', icon: 'pi pi-cog', routerLink: '/settings' },
    { separator: true },
    {
      label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.signOut()
    },
  ];

  onDarkModeChanged({ checked }: ToggleSwitchChangeEvent) {
    this.darkMode.set(checked);
    this.updatingMode.set(true);
    this.updateMode(checked ? 'dark' : 'light').subscribe({
      complete: () => {
        this.updatingMode.set(false);
      },
      error: (error: Error) => {
        this.updatingMode.set(false);
        this.messageService.add({
          detail: error.message,
          summary: 'Error',
          severity: 'error'
        });
      }
    });
  }
}
