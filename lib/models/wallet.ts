import { z } from "zod";

export const WalletTransferSchema = z.object({
  id: z.string(),
  from: z.string().uuid().nullable(),
  to: z.string().uuid(),
  amount: z.number(),
  status: z.enum(['pending', 'cancelled', 'complete']),
  type: z.enum(['funding', 'reward', 'withdrawal']),
  date: z.date(),
  payment: z.object({
    id: z.string().uuid(),
    currency: z.string(),
    amount: z.number(),
    status: z.enum(['pending', 'cancelled', 'complete'])
  }).nullable()
});

export const WalletBalanceSchema = z.object({
  balance: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  ownerId: z.number(),
  id: z.string()
});

export const BalancesSchema = z.object({
  funding: WalletBalanceSchema,
  rewards: WalletBalanceSchema
});

export const WalletTransfersResponseSchema = z.object({
  total: z.number(),
  data: z.array(WalletTransferSchema)
})

export type WalletBalanceInfo = z.infer<typeof WalletBalanceSchema>;
export type WalletTransfer = z.infer<typeof WalletTransferSchema>;
export type WalletTransfersResponse = z.infer<typeof WalletTransfersResponseSchema>;

export type WalletBalanceResponse = {
  funding: WalletBalanceInfo;
  rewards: WalletBalanceInfo;
}
