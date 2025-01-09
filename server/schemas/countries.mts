import { z } from "zod";

export const ExchangerateQuerySchema = z.object({
  src: z.string().length(3),
  dest: z.string()
    .transform(val => val.toUpperCase().split(','))
    .pipe(z.string().length(3).array())
});

export const GetCountryByIso2CodeSchema = z.object({
  alpha2Code: z.string()
    .length(2)
    .transform(val => val.toUpperCase())
    .or(
      z.string()
        .transform(val => val.toUpperCase().split(','))
        .pipe(z.string().length(2).array())
    )
});
