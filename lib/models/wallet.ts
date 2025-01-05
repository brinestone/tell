export type WalletBalanceInfo = {
  id: string;
  balance: number;
  ownerId: number;
  ownerName: string | null;
};

export type WalletBalanceResponse = {
  funding: WalletBalanceInfo;
  rewards: WalletBalanceInfo;
}
