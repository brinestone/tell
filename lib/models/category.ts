import { z } from "zod";


export const CategorySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  image: z.string().nullable().default(null)
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoryLookupSchema = CategorySchema.omit({
  image: true,
  description: true
}).extend({
  publicationCount: z.union([z.string(), z.number()]).pipe(z.coerce.number())
})

export type CategoryLookup = z.infer<typeof CategoryLookupSchema>;
