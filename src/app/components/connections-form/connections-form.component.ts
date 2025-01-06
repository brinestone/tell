import { Component, computed, inject } from '@angular/core';
import { Button }                      from 'primeng/button';
import { Tag }                         from 'primeng/tag';
import { rxResource }                  from '@angular/core/rxjs-interop';
import { HttpClient }                  from '@angular/common/http';
import { ConnectedAccount }            from '@lib/models/user';
import { ProgressSpinner }             from 'primeng/progressspinner';
import { environment }                 from '@env/environment.development';

@Component({
  selector: 'tm-connections-form',
  imports: [
    Button,
    Tag,
    ProgressSpinner
  ],
  templateUrl: './connections-form.component.html',
  styleUrl: './connections-form.component.scss'
})
export class ConnectionsFormComponent {
  private http = inject(HttpClient);
  readonly connections = rxResource({
    loader: () => this.http.get<ConnectedAccount[]>('/api/users/connections')
  });
  readonly telegramConnection = computed(() => {
    return this.connections.value()?.find(({ provider }) => provider == 'telegram');
  });
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
  })
  readonly isTelegramAccountConnected = computed(() => {
    const connections = this.connections.value();
    return connections?.some(({ provider, status }) => status == 'active' && provider == 'telegram') ?? false;
  });

  onConnectTelegramAccountButtonClicked() {
    // location.href = environment.telegramBot;
    window.open(environment.telegramBot, '_blank')
  }
}
