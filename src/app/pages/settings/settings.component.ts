import { Component, inject, signal } from '@angular/core';
import { Panel } from 'primeng/panel';
import { Divider } from 'primeng/divider';
import { Button } from 'primeng/button';
import { PrefsFormComponent } from '@app/components/prefs-form/prefs-form.component';
import { ConnectionsFormComponent } from '@app/components/connections-form/connections-form.component';
import { PaymentMethodRegistrationComponent } from "@app/components/payment-method-registration/payment-method-registration.component";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { dispatch } from '@ngxs/store';
import { SignOut } from '@app/state/user';
import { environment } from '@env/environment.development';
@Component({
  selector: 'tm-settings',
  imports: [
    Panel, ConfirmDialogModule,
    Divider,
    Button,
    PrefsFormComponent,
    ConnectionsFormComponent,
    PaymentMethodRegistrationComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  providers: [ConfirmationService]
})
export class SettingsComponent {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private deletingAccount = signal(false);
  private signOut = dispatch(SignOut);

  onDeleteAccountButtonClicked(event: MouseEvent) {
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
        size: 'small'
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Yes, delete my account',
        size: 'small'
      },
      accept: () => {
        this.deletingAccount.set(true);
        this.http.delete(environment.apiOrigin + '/auth').subscribe({
          complete: () => {
            this.deletingAccount.set(false);
            this.signOut('/');
          },
          error: (error: HttpErrorResponse) => {
            this.deletingAccount.set(false);
            this.messageService.add({
              summary: 'Error',
              severity: 'error',
              detail: error.error?.message ?? error.message
            });
          }
        })
      }
    })
  }
}
