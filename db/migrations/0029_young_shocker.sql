CREATE TYPE "public"."credit_allocation_status" AS ENUM('active', 'cancelled', 'complete');--> statement-breakpoint
CREATE TABLE "credit_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exhausted" real NOT NULL,
	"allocated" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status" "credit_allocation_status" DEFAULT 'active' NOT NULL,
	"wallet" uuid NOT NULL
);
--> statement-breakpoint
DROP VIEW "public"."vw_funding_balances";--> statement-breakpoint
DROP VIEW "public"."vw_reward_balances";--> statement-breakpoint
ALTER TABLE "campaign_publications" ADD COLUMN "credit_allocation" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN "credit_allocation" uuid;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_wallet_wallets_id_fk" FOREIGN KEY ("wallet") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_publications" ADD CONSTRAINT "campaign_publications_credit_allocation_credit_allocations_id_fk" FOREIGN KEY ("credit_allocation") REFERENCES "public"."credit_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_credit_allocation_credit_allocations_id_fk" FOREIGN KEY ("credit_allocation") REFERENCES "public"."credit_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_publications" DROP COLUMN "credits";--> statement-breakpoint
CREATE VIEW "public"."vw_funding_balances" AS (select "wallets"."id", 
      "wallets"."starting_balance" +
      SUM(
        CASE
          WHEN ("credit_allocations"."status" = 'active' or "credit_allocations"."status" = 'complete') THEN "credit_allocations"."allocated"
          ELSE "credit_allocations"."allocated" - "credit_allocations"."exhausted"
        END
      ) +
      SUM(
        CASE
          WHEN ("wallet_transactions"."from" = "wallets"."id" and "wallet_transactions"."type" = 'funding' and "wallet_transactions"."status" = 'complete') THEN -"wallet_transactions"."value"
          WHEN ("wallet_transactions"."to" = "wallets"."id" and "wallet_transactions"."type" = 'funding' and "wallet_transactions"."status" = 'complete') THEN "wallet_transactions"."value"
          ELSE 0
        END
      )::BIGINT as "balance", "wallets"."owned_by" from "wallets" left join "wallet_transactions" on ("wallets"."id" = "wallet_transactions"."from" or "wallets"."id" = "wallet_transactions"."to") left join "users" on "wallets"."owned_by" = "users"."id" left join "credit_allocations" on "wallets"."id" = "credit_allocations"."wallet" group by "wallets"."id", "wallets"."owned_by");--> statement-breakpoint
CREATE VIEW "public"."vw_reward_balances" AS (select "wallets"."id", 
      "wallets"."starting_balance" +
      SUM(
        CASE
          WHEN ("wallet_transactions"."from" = "wallets"."id" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."status" = 'complete') THEN -"wallet_transactions"."value"
          WHEN ("wallet_transactions"."to" = "wallets"."id" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."status" = 'complete') THEN "wallet_transactions"."value"
          ELSE 0
        END
      )::BIGINT as "balance", "wallets"."owned_by" from "wallets" left join "wallet_transactions" on ("wallets"."id" = "wallet_transactions"."from" or "wallets"."id" = "wallet_transactions"."to") left join "users" on "wallets"."owned_by" = "users"."id" group by "wallets"."id", "wallets"."owned_by");