import { z } from "zod";

export type PaymentMethodLookup = {
  provider: "momo";
  status: "active" | "inactive" | "re-connection required";
};

export const PaymentMethodProviderSchema = z.object({
  label: z.string(),
  name: z.enum(['momo', 'virtual']),
  image: z.string().optional()
});

export type PaymentMethodProvider = z.infer<typeof PaymentMethodProviderSchema>;
