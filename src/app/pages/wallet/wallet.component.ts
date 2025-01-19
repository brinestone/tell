import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, model, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TopUpFormComponent } from '@app/components/top-up-form/top-up-form.component';
import { preferences } from '@app/state/user';
import { WalletBalanceResponse, WalletTransfersResponse } from '@lib/models/wallet';
import { select } from '@ngxs/store';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Drawer } from 'primeng/drawer';
import { Panel } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'tm-wallet',
  imports: [
    Card,
    DecimalPipe,
    CurrencyPipe,
    TableModule,
    Panel,
    DatePipe,
    Button,
    ProgressSpinnerModule,
    DecimalPipe,
    Drawer,
    Tag,
    TopUpFormComponent
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class WalletComponent {
  private http = inject(HttpClient);
  private ms = inject(MessageService);
  private form = viewChild(TopUpFormComponent);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly transfers = rxResource({
    request: () => ({ page: this.currentPage(), size: this.pageSize(), }),
    loader: ({ request }) => this.http.get<WalletTransfersResponse>('/api/wallet/transfers', {
      params: request
    })
  })
  readonly balances = rxResource({
    loader: () => this.http.get<WalletBalanceResponse>('/api/wallet/balances')
  });
  readonly topUpQuery = injectQueryParams('top-up');
  readonly showTopupFormModal = model(false);
  readonly prefs = select(preferences);

  constructor(private route: ActivatedRoute, private router: Router) {
    effect(() => {
      const topUpQueryAvailable = this.topUpQuery() == 'true';
      if (!topUpQueryAvailable) return;
      this.showTopupFormModal.set(true);
    })
  }

  publicationModalHidden() {
    const form = this.form();
    if (form) {
      form.reset();
    }
    this.router.navigate([], { queryParamsHandling: 'replace', queryParams: {} })
  }

  transferStatusText(status: 'pending' | 'cancelled' | 'complete') {
    switch (status) {
      case 'complete': return 'success';
      case 'pending': return 'warn';
      default:
        return 'secondary'
    }
  }

  transferTypeText(type: 'funding' | 'reward' | 'withdrawal') {
    switch (type) {
      case 'funding': return 'warn';
      case 'reward': return 'success';
      default: return 'secondary';
    }
  }

  publicationModalShown() {
    const form = this.form();
    if (form) {
      form.reset();
    }
  }

  onTopUpFormSubmitted() {
    this.showTopupFormModal.set(false);
    this.balances.reload();
    this.transfers.reload();
  }

  onTopUpFormErrored(event: Error) {
    this.ms.add({
      severity: 'error',
      summary: 'Error',
      key: 'under-modal',
      detail: event.message
    });
  }
}
