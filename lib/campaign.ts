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

export interface LookupCampaingsResponse {
  total: number;
  page: number;
  size: number;
  data: Campaign[];
}
