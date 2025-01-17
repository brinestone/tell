export interface Campaign {
  description: string | null
  id: number;
  title: string;
  media: string[];
  links: string[];
  emails: string[];
  phones: string[];
  redirectUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  categories: number[];
}

export type CampaignLookup = {
  categoryCount: number;
  title: string;
  updatedAt: Date;
}

export type LookupCampaignResponse = {
  total: number;
  page: number;
  size: number;
  data: CampaignLookup[];
}

export interface CampaignPublication {
  id: number;
  campaign: number;
  createdAt: Date;
  updatedAt: Date;
  channels: string[];
  assignedTokens: number;
  publishAfter: Date;
  publishBefore?: Date;
}
