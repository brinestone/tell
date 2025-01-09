import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConnectedAccount } from '@lib/models/user';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tag } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

export type VerificationSubmission = {
  code: string;
};

@Component({
  selector: 'tm-telegram-connection-form',
  imports: [
    Button,
    Tag, InputGroupModule, InputGroupAddonModule,
    ProgressSpinner,
    InputText,
    FormsModule
  ],
  templateUrl: './telegram-connection-form.component.html',
  styleUrl: './telegram-connection-form.component.scss'
})
export class TelegramConnectionFormComponent {
  readonly showVerificationCodeInput = signal(false);
  readonly telegramBotUrl = input.required<string>();
  readonly acountLoading = input(false);
  readonly telegramConnection = input<ConnectedAccount>();
  readonly submitting = input<boolean>();
  readonly disconnecting = input<boolean>();
  readonly telegramConnectionStatusText = computed(() => {
    const conn = this.telegramConnection();
    switch (conn?.status) {
      case 'active':
        return 'connected';
      case 'inactive':
        return 'inactive';
      case 'reconnect_required':
        return 'attention required';
      default:
        return 'not connected';
    }
  });
  readonly telegramConnectionSeverityText = computed(() => {
    const conn = this.telegramConnection();
    switch (conn?.status) {
      case 'active': return 'success';
      case 'reconnect_required': return 'warn';
      default: return 'secondary';
    }
  })
  readonly isTelegramAccountConnected = computed(() => {
    return this.telegramConnection()?.status === 'active';
  });
  readonly verificationCode = model<string>();
  readonly submission = output<VerificationSubmission>();
  readonly disconnect = output();

  onVerifyCodeButtonClicked() {
    this.submission.emit({ code: String(this.verificationCode()) });
  }
  onCancelButtonClicked() {
    this.verificationCode.set(undefined);
    this.showVerificationCodeInput.set(false);
  }

  onDisconnectButtonClicked() {
    this.disconnect.emit();
  }
}
