import { z } from "zod";

export const WalletTransferSchema = z.object({
  burst: z.union([z.string(), z.date()]).pipe(z.coerce.date()),
  creditAllocationId: z.string().uuid().nullable(),
  creditAllocation: z
    .object({
      allocated: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
      status: z.string(),
    })
    .nullable(),
  credits: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  notes: z.string().nullable(),
  paymentTransaction: z
    .object({
      status: z.string(),
      amount: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
      currency: z.string(),
    })
    .nullable(),
  paymentTransactionId: z.string().nullable(),
  recordedAt: z.union([z.string(), z.date()]).pipe(z.coerce.date()),
  status: z.string(),
  transaction: z.string().uuid(),
  type: z.string(),
});

export const WalletTransferGroupSchema = z.object({
  burst: z.union([z.string(), z.date()]).pipe(z.coerce.date()),
  fundingRewardsRatio: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.number()),
  owner: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  transferredCredits: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  wallet: z.string().uuid(),
  transfers: z.array(WalletTransferSchema),
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
  groups: z.array(WalletTransferGroupSchema),
});

export type WalletBalanceInfo = z.infer<typeof WalletBalanceSchema>;
export type WalletTransfer = z.infer<typeof WalletTransferSchema>;
export type WalletTransfersResponse = z.infer<typeof WalletTransfersResponseSchema>;

export type WalletBalanceResponse = {
  funding: WalletBalanceInfo;
  rewards: WalletBalanceInfo;
}
