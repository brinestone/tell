DROP VIEW "public"."vw_reward_balances";--> statement-breakpoint
CREATE VIEW "public"."vw_reward_balances" AS (select "wallets"."id", 
      SUM(
        CASE
          WHEN ("wallet_transactions"."from" = "wallets"."id" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."status" = 'complete') THEN -"wallet_transactions"."value"
          WHEN ("wallet_transactions"."to" = "wallets"."id" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."status" = 'complete') THEN "wallet_transactions"."value"
          ELSE 0
        END
      )::BIGINT as "balance", "wallets"."owned_by" from "wallets" left join "wallet_transactions" on ("wallets"."id" = "wallet_transactions"."from" or "wallets"."id" = "wallet_transactions"."to") left join "users" on "wallets"."owned_by" = "users"."id" group by "wallets"."id", "wallets"."owned_by");