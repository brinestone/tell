export interface Campaign {
  id: number;
  title: string;
  media: string[];
  links: string[];
  emails: string[];
  phones: string[];
  createdAt: Date;
  updatedAt: Date;
  categories: number[];
}

export interface LookupCampaignResponse {
  total: number;
  page: number;
  size: number;
  data: Campaign[];
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
