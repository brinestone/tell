import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, model, ResourceRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PublicationFormComponent } from '@app/components/publication-form';
import { Campaign, CampaignPublication } from '@lib/models/campaign';
import { WalletBalanceResponse } from '@lib/models/wallet';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DataView } from 'primeng/dataview';
import { Dialog } from 'primeng/dialog';
import { Divider } from 'primeng/divider';
import { Message } from 'primeng/message';
import { ProgressBar } from 'primeng/progressbar';
import { of } from 'rxjs';

@Component({
  selector: 'tm-campaign-publications',
  imports: [
    DataView,
    Button,
    DatePipe,
    Divider,
    DecimalPipe,
    Card,
    ProgressBar,
    Message,
    Dialog,
    PublicationFormComponent,
    RouterLink,
  ],
  templateUrl: './campaign-publications.component.html',
  styleUrl: './campaign-publications.component.scss'
})
export class CampaignPublications {
  private http = inject(HttpClient);
  readonly campaign = input<Campaign>();
  readonly showNewPublicationModal = model(false);
  readonly publications: ResourceRef<CampaignPublication[]> = rxResource({
    request: () => this.campaign()?.id,
    loader: ({ request }) => request ? this.http.get<CampaignPublication[]>(`/api/campaigns/${request}/publications`) : of([])
  });
  private readonly walletBalance = rxResource({
    loader: () => this.http.get<WalletBalanceResponse>('/api/wallet/balances')
  });
  readonly availableCredits = computed(() => {
    return this.walletBalance.value()?.funding?.balance ?? 0
  });
  onPublicationSubmitted() {
    this.showNewPublicationModal.set(false);
    this.publications.reload();
    this.walletBalance.reload();
  }
}
