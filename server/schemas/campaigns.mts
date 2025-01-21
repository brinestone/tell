import { z } from "zod";

export const CampaignIdExtractorSchema = (selector: string) => z.object({
  [selector]: z.string().pipe(z.coerce.number()).refine(n => !isNaN(n))
});

export const CampaignLookupPaginationValidationSchema = z.object({
  page: z.string()
    .optional()
    .transform(n => {
      if (n && /^\d+$/.test(n)) return n;
      return undefined;
    })
    .pipe(z.coerce.number().optional().default(0)),
  size: z.string()
    .optional()
    .transform(n => {
      if (n && /^\d+$/.test(n)) return n;
      return undefined;
    })
    .pipe(z.coerce.number().optional().default(10))
})
