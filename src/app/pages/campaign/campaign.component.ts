import { HttpClient } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CampaignAnalytics } from '@app/components/campaign-analytics/campaign-analytics.component';
import { CampaignPublications } from '@app/components/campaign-publications/campaign-publications.component';
import { CampaignSettings } from '@app/components/campaign-settings/campaign-settings.component';
import { Campaign } from '@lib/models/campaign';
import { injectParams } from 'ngxtension/inject-params';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'tm-campaign',
  imports: [
    Tabs,
    TabList,
    Tab,
    CampaignAnalytics,
    CampaignPublications,
    CampaignSettings,
    TabPanel,
    ProgressSpinner,
    TabPanels
  ],
  templateUrl: './campaign.component.html',
  styleUrl: './campaign.component.scss'
})
export class CampaignComponent {
  private http = inject(HttpClient);
  readonly tabParam = injectQueryParams('activeTab', { initialValue: 'analytics' });
  readonly activeTabIndex = computed(() => {
    const tabParam = this.tabParam();
    switch (tabParam) {
      default:
      case 'general': return 0;
      case 'publications': return 1;
      case 'settings': return 2;
    }
  });
  readonly campaignId = injectParams('campaign');
  readonly campaign = rxResource({
    request: () => this.campaignId(),
    loader: ({ request }) => {
      if (!request) return EMPTY;
      return this.http.get<Campaign>(`/api/campaigns/${request}`)
    }
  });
}
