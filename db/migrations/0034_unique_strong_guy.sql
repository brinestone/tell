DROP VIEW "public"."vw_funding_balances";--> statement-breakpoint
CREATE VIEW "public"."vw_funding_balances" AS (select "wallets"."id", 
      "wallets"."starting_balance" +
      SUM(
        CASE
          WHEN ("credit_allocations"."status" = 'active' or "credit_allocations"."status" = 'complete') THEN "credit_allocations"."allocated"
          WHEN "credit_allocations"."status" = 'cancelled' THEN "credit_allocations"."allocated" - "credit_allocations"."exhausted"
          ELSE 0
        END
      ) * -1 +
      SUM(
        CASE
          WHEN ("wallet_transactions"."from" = "wallets"."id" and "wallet_transactions"."type" = 'funding' and "wallet_transactions"."status" = 'complete') THEN -"wallet_transactions"."value"
          WHEN ("wallet_transactions"."to" = "wallets"."id" and "wallet_transactions"."type" = 'funding' and "wallet_transactions"."status" = 'complete') THEN "wallet_transactions"."value"
          ELSE 0
        END
      )::BIGINT as "balance", "wallets"."owned_by" from "wallets" left join "wallet_transactions" on ("wallets"."id" = "wallet_transactions"."from" or "wallets"."id" = "wallet_transactions"."to") left join "users" on "wallets"."owned_by" = "users"."id" left join "credit_allocations" on "wallets"."id" = "credit_allocations"."wallet" group by "wallets"."id", "wallets"."owned_by");