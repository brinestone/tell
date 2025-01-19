import { DecimalPipe }                      from '@angular/common';
import { HttpClient }                       from '@angular/common/http';
import { Component, effect, inject, model } from '@angular/core';
import { rxResource }                       from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router }           from '@angular/router';
import { TopUpFormComponent }               from '@app/components/top-up-form/top-up-form.component';
import { WalletBalanceResponse }            from '@lib/models/wallet';
import { injectQueryParams }                from 'ngxtension/inject-query-params';
import { Button }                           from 'primeng/button';
import { Card }                             from 'primeng/card';
import { Drawer }                           from 'primeng/drawer';
import { Panel }                            from 'primeng/panel';
import { ProgressSpinnerModule }            from 'primeng/progressspinner';
import { TableModule }                      from 'primeng/table';

@Component({
  selector: 'tm-wallet',
  imports: [
    Card,
    DecimalPipe,
    TableModule,
    Panel,
    Button,
    ProgressSpinnerModule,
    Drawer,
    TopUpFormComponent
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class WalletComponent {
  private http = inject(HttpClient);
  readonly balances = rxResource({
    loader: () => this.http.get<WalletBalanceResponse>('/api/wallet/balances')
  });
  readonly topUpQuery = injectQueryParams('top-up');
  readonly showTopupFormModal = model(false);

  constructor(private route: ActivatedRoute, private router: Router) {
    effect(() => {
      const topUpQueryAvailable = this.topUpQuery() == 'true';
      if (!topUpQueryAvailable) return;
      this.showTopupFormModal.set(true);
    })
  }

  publicationModalHidden() {
    this.router.navigate([], { queryParamsHandling: 'replace', queryParams: {} })
  }
}
