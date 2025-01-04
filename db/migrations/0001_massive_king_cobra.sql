ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_wallet_wallets_id_fk";
--> statement-breakpoint
ALTER TABLE "wallet_transactions" DROP COLUMN "wallet";