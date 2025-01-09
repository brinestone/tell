CREATE TYPE "public"."account_connection_status" AS ENUM('active', 'inactive', 'reconnect_required');--> statement-breakpoint
ALTER TABLE "account_transactions" RENAME TO "payment_transactions";--> statement-breakpoint
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_account_transaction_account_transactions_id_fk";
--> statement-breakpoint
ALTER TABLE "account_connections" ADD COLUMN "status" "account_connection_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_account_transaction_payment_transactions_id_fk" FOREIGN KEY ("account_transaction") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_connections" DROP COLUMN "is_valid";