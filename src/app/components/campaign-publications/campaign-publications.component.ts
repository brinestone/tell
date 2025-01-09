import { Component, inject, input, ResourceRef } from '@angular/core';
import { rxResource }                            from '@angular/core/rxjs-interop';
import { DataView }                 from 'primeng/dataview';
import { HttpClient }               from '@angular/common/http';
import { CampaignPublication }      from '@lib/models/campaign';
import { of }                       from 'rxjs';

@Component({
  selector: 'tm-campaign-publications',
  imports: [
    DataView
  ],
  templateUrl: './campaign-publications.component.html',
  styleUrl: './campaign-publications.component.scss'
})
export class CampaignPublicationsComponent {
  private http = inject(HttpClient);
  readonly campaignId = input<number>();
  readonly publications: ResourceRef<CampaignPublication[]> = rxResource({
    request: () => ({
      id: this.campaignId()
    }),
    loader: ({ request: { id } }) => id ? this.http.get<CampaignPublication[]>(`/api/campaigns/${id}/publications`) : of([])
  })
}
