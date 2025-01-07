import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment.development';
import { ConnectedAccount } from '@lib/models/user';
import { TelegramConnectionFormComponent, VerificationSubmission } from '../connection-forms/telegram-connection-form/telegram-connection-form.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'tm-connections-form',
  imports: [
    TelegramConnectionFormComponent
  ],
  templateUrl: './connections-form.component.html',
  styleUrl: './connections-form.component.scss'
})
export class ConnectionsFormComponent {
  private messageService = inject(MessageService);
  private http = inject(HttpClient);
  readonly verifyingTelegramCode = signal(false);
  readonly disconnectingTelegram = signal(false);
  readonly connections = rxResource({
    loader: () => this.http.get<ConnectedAccount[]>('/api/users/connections')
  });
  readonly telegramConnection = computed(() => {
    return this.connections.value()?.find(({ provider }) => provider == 'telegram');
  });
  readonly telegramBotLink = environment.telegramBot;

  onTelegramVerificationCodeSubmitted({ code }: VerificationSubmission) {
    this.verifyingTelegramCode.set(true);
    this.http.get('/api/users/connections/verify/tm', {
      params: {
        code
      }
    }).subscribe({
      complete: () => {
        this.verifyingTelegramCode.set(false);
        this.connections.reload();
        this.messageService.add({
          severity: 'info',
          summary: 'Notification',
          detail: 'Your telegram account has been successfully linked.'
        })
      },
      error: (error: HttpErrorResponse) => {
        this.verifyingTelegramCode.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message ?? error.message
        });
      }
    });
  }

  onDisconnectTelegramConnectionRequested() {
    this.disconnectingTelegram.set(true);
    this.http.get('/api/users/connections/disconnect/tm').subscribe({
      error: (error: HttpErrorResponse) => {
        this.disconnectingTelegram.set(false);
        this.messageService.add({
          summary: 'Error',
          severity: 'error',
          detail: error.error?.message ?? error.message
        });
      },
      complete: () => {
        this.disconnectingTelegram.set(false);
        this.connections.reload();
        this.messageService.add({
          summary: 'Info',
          severity: 'info',
          detail: 'Your Telegram account was disconnected successfully.'
        });
      }
    })
  }
}
