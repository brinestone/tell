import { Component, computed, effect, inject, linkedSignal, model, ResourceRef, signal } from '@angular/core';
import { TableModule }                                                                   from 'primeng/table';
import { Button }                                                                        from 'primeng/button';
import { InputText }                                                                     from 'primeng/inputtext';
import { IconField }                                                                     from 'primeng/iconfield';
import { InputIcon }                                                                     from 'primeng/inputicon';
import { Drawer }                                                                        from 'primeng/drawer';
import { ReactiveFormsModule }                                                           from '@angular/forms';
import { DatePipe }                                                                      from '@angular/common';
import { MenuItem, MessageService, ToastMessageOptions }                                 from 'primeng/api';
import {
  rxResource
}                                                                                        from '@angular/core/rxjs-interop';
import {
  CountryData
}                                                                                        from '@lib/models/country-data';
import { Category }                                                                      from '@lib/models/category';
import { HttpClient }                                                                    from '@angular/common/http';
import { Campaign, LookupCampaignResponse }                                              from '@lib/models/campaign';
import { Panel }                                                                         from 'primeng/panel';
import { Menu }                                                                          from 'primeng/menu';
import { DataViewModule }                                                                from 'primeng/dataview';
import {
  CampaignFormComponent
}                                                                                        from '@app/components/campaign-form/campaign-form.component';
import {
  CampaignPublicationsComponent
}                                                                                        from '@app/components/campaign-publications/campaign-publications.component';
import {
  PublicationFormComponent
}                                                                                        from '@app/components/publication-form/publication-form.component';
import { Ripple }                                                                        from 'primeng/ripple';

@Component({
  selector: 'tm-campaigns',
  imports: [
    TableModule,
    Button,
    InputText,
    IconField,
    InputIcon,
    Drawer,
    ReactiveFormsModule,
    DatePipe,
    Panel,
    Menu,
    DataViewModule,
    CampaignFormComponent,
    CampaignPublicationsComponent,
    PublicationFormComponent,
    Ripple
  ],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.scss'
})
export class CampaignsComponent {
  private messageService = inject(MessageService);
  private http = inject(HttpClient);
  readonly selectedCampaign = model<Campaign>();
  readonly targetCampaignId = linkedSignal(() => this.selectedCampaign()?.id)
  showCampaignModal = model(false);
  showPublicationModal = model(false);
  currentPage = model(0);
  currentPageSize = model(20);
  readonly tokens = signal(0);

  readonly categories = rxResource({
    loader: () => this.http.get<Category[]>('/api/categories')
  });
  readonly countries = rxResource({
    loader: () => this.http.get<CountryData[]>('/api/countries')
  });

  readonly campaigns: ResourceRef<LookupCampaignResponse> = rxResource({
    request: () => ({ page: this.currentPage(), size: this.currentPageSize() }),
    loader: ({ request: { page, size } }) => this.http.get<LookupCampaignResponse>('/api/campaigns', {
      params: {
        page,
        size
      }
    })
  });

  readonly campaignOptions = computed(() => {
    return (this.campaigns.value()?.data ?? []).map((campaign: Campaign) => {
      return [
        {
          label: 'Publish',
          icon: 'pi pi-megaphone',
          command: () => {
            this.targetCampaignId.set(campaign.id);
            this.showPublicationModal.set(true);
          }
        },
        { label: 'Edit', icon: 'pi pi-pencil' },
        { separator: true },
        { label: 'Delete', icon: 'pi pi-trash' }
      ] as MenuItem[];
    })
  })

  onCampaignFormSubmitted() {
    this.campaigns.reload();
    this.showCampaignModal.set(false);
  }

  onCampaignFormErrored(error: Error) {
    const message: ToastMessageOptions = {
      summary: 'Error',
      detail: error.message,
      severity: 'error',
    };
    if (this.showCampaignModal()) {
      message.key = 'under-modal';
    }
    this.messageService.add(message);
  }

  constructor() {
    effect(() => {
      const fetchError = this.categories.error();
      if (!fetchError) return;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: (fetchError as Error).message,
      })
    });
  }

  onPublicationFormSubmitted() {
    this.showPublicationModal.set(false);
  }
}
