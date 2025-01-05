import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, model } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { WalletBalanceResponse } from '@lib/models/wallet';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Panel } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Drawer } from 'primeng/drawer';
import { TopUpFormComponent } from '@app/components/top-up-form/top-up-form.component';

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

  readonly showTopupFormModal = model(false);
}
