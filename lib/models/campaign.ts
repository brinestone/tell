import { z } from "zod";

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

export const CampaignPublicationSchema = z.object({
  id: z.number(),
  publishBefore: z.string().nullable().pipe(z.coerce.date().nullable()),
  publishAfter: z.string().nullable().pipe(z.coerce.date().nullable()),
  creditAllocation: z.object({
    id: z.string().uuid(),
    allocated: z.number(),
    exhausted: z.union([z.string(), z.number()]).pipe(z.coerce.number())
  })
});

export type CampaignPublication = z.infer<typeof CampaignPublicationSchema>;
