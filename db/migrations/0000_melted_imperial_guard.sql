CREATE TYPE "public"."credit_allocation_status" AS ENUM('active', 'cancelled', 'complete');--> statement-breakpoint
CREATE TYPE "public"."payment_method_provider" AS ENUM('momo', 'virtual');--> statement-breakpoint
CREATE TYPE "public"."payment_method_status" AS ENUM('active', 'inactive', 're-connection required');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'cancelled', 'complete');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_type" AS ENUM('funding', 'reward', 'withdrawal');--> statement-breakpoint
CREATE TYPE "public"."account_connection_providers" AS ENUM('telegram');--> statement-breakpoint
CREATE TYPE "public"."account_connection_status" AS ENUM('active', 'inactive', 'reconnect_required');--> statement-breakpoint
CREATE TYPE "public"."theme_pref" AS ENUM('system', 'dark', 'light');--> statement-breakpoint
CREATE TABLE "campaign_publications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campaign_publications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"campaign" bigint NOT NULL,
	"credit_allocation" uuid NOT NULL,
	"publish_after" date DEFAULT now(),
	"publish_before" date
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"media" text[] DEFAULT '{}',
	"links" text[] DEFAULT '{}',
	"emails" text[] DEFAULT '{}',
	"phones" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"categories" bigint[] DEFAULT '{}',
	"created_by" bigint NOT NULL,
	"redirect_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"image" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "payment_method_provider" NOT NULL,
	"params" jsonb NOT NULL,
	"status" "payment_method_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"owner" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_method" "payment_method_provider" NOT NULL,
	"status" "transaction_status" NOT NULL,
	"external_transaction_id" varchar(400),
	"recorded_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"value" real NOT NULL,
	"notes" text,
	"currency" varchar(10) NOT NULL,
	"params" jsonb,
	"inbound" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exhausted" real DEFAULT 0 NOT NULL,
	"allocated" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status" "credit_allocation_status" DEFAULT 'active' NOT NULL,
	"wallet" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" bigint NOT NULL,
	"from" uuid NOT NULL,
	"to" uuid NOT NULL,
	"recorded_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"status" "transaction_status" DEFAULT 'pending',
	"type" "wallet_transaction_type" NOT NULL,
	"notes" text,
	"account_transaction" uuid,
	"credit_allocation" uuid
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owned_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"starting_balance" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" varchar(39) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"window" interval NOT NULL,
	"user" bigint NOT NULL,
	"replaced_by" uuid
);
--> statement-breakpoint
CREATE TABLE "account_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user" bigint NOT NULL,
	"provider" "account_connection_providers" NOT NULL,
	"params" jsonb NOT NULL,
	"status" "account_connection_status" DEFAULT 'active' NOT NULL,
	"provider_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federated_credentials" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"provider" varchar(255) NOT NULL,
	"last_access_token" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(32) NOT NULL,
	"user" bigint NOT NULL,
	"ip" varchar(39) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"replaced_by" uuid,
	"revoked_by" bigint,
	"window" interval NOT NULL,
	"access_token" uuid NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_prefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user" bigint NOT NULL,
	"country" varchar(2) NOT NULL,
	"theme" "theme_pref" DEFAULT 'light' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"language" varchar(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100 CACHE 1),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"names" varchar(100) NOT NULL,
	"image_url" varchar(255),
	"email" varchar(100) NOT NULL,
	"dob" date,
	"phone" varchar(255),
	"credentials" varchar
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"window" interval NOT NULL,
	"hash" varchar(32) NOT NULL,
	"confirmed_at" timestamp,
	"data" jsonb,
	CONSTRAINT "verification_codes_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
ALTER TABLE "campaign_publications" ADD CONSTRAINT "campaign_publications_campaign_campaigns_id_fk" FOREIGN KEY ("campaign") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_publications" ADD CONSTRAINT "campaign_publications_credit_allocation_credit_allocations_id_fk" FOREIGN KEY ("credit_allocation") REFERENCES "public"."credit_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_wallet_wallets_id_fk" FOREIGN KEY ("wallet") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_from_wallets_id_fk" FOREIGN KEY ("from") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_to_wallets_id_fk" FOREIGN KEY ("to") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_account_transaction_payment_transactions_id_fk" FOREIGN KEY ("account_transaction") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_credit_allocation_credit_allocations_id_fk" FOREIGN KEY ("credit_allocation") REFERENCES "public"."credit_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_owned_by_users_id_fk" FOREIGN KEY ("owned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_replaced_by_access_tokens_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."access_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_connections" ADD CONSTRAINT "account_connections_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_refresh_tokens_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."refresh_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_access_token_access_tokens_id_fk" FOREIGN KEY ("access_token") REFERENCES "public"."access_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_prefs" ADD CONSTRAINT "user_prefs_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_credentials_federated_credentials_id_fk" FOREIGN KEY ("credentials") REFERENCES "public"."federated_credentials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_methods_provider_owner_index" ON "payment_methods" USING btree ("provider","owner");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_user_index" ON "refresh_tokens" USING btree ("token","user");--> statement-breakpoint
CREATE VIEW "public"."vw_funding_balances" AS (select "wallets"."id", 
      "wallets"."starting_balance" +
      SUM(
        CASE
          WHEN "credit_allocations"."status" = 'active' THEN "credit_allocations"."allocated"
          ELSE 0
        END
      ) * -1 +
      SUM(
        CASE
          WHEN ("wallet_transactions"."from" = "wallets"."id" and "wallet_transactions"."type" = 'funding' and "wallet_transactions"."status" = 'complete') THEN -"wallet_transactions"."value"
          WHEN ("wallet_transactions"."to" = "wallets"."id" and "wallet_transactions"."type" = 'funding' and "wallet_transactions"."status" = 'complete') THEN "wallet_transactions"."value"
          ELSE 0
        END
      )::BIGINT as "balance", "wallets"."owned_by" from "wallets" left join "wallet_transactions" on ("wallets"."id" = "wallet_transactions"."from" or "wallets"."id" = "wallet_transactions"."to") left join "users" on "wallets"."owned_by" = "users"."id" left join "credit_allocations" on "wallets"."id" = "credit_allocations"."wallet" group by "wallets"."id", "wallets"."owned_by");--> statement-breakpoint
CREATE VIEW "public"."vw_reward_balances" AS (select "wallets"."id", 
      SUM(
        CASE
          WHEN ("wallet_transactions"."from" = "wallets"."id" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."status" = 'complete') THEN -"wallet_transactions"."value"
          WHEN ("wallet_transactions"."to" = "wallets"."id" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."status" = 'complete') THEN "wallet_transactions"."value"
          ELSE 0
        END
      )::BIGINT as "balance", "wallets"."owned_by" from "wallets" left join "wallet_transactions" on ("wallets"."id" = "wallet_transactions"."from" or "wallets"."id" = "wallet_transactions"."to") left join "users" on "wallets"."owned_by" = "users"."id" group by "wallets"."id", "wallets"."owned_by");--> statement-breakpoint
CREATE VIEW "public"."vw_credit_allocations" AS (select "credit_allocations"."id", "credit_allocations"."wallet", "credit_allocations"."allocated", 
        COALESCE(SUM("wallet_transactions"."value"), 0)
       as "exhausted" from "credit_allocations" left join "wallet_transactions" on ("credit_allocations"."id" = "wallet_transactions"."credit_allocation" and "wallet_transactions"."type" = 'reward' and "wallet_transactions"."from" = "credit_allocations"."wallet") group by "credit_allocations"."id");--> statement-breakpoint
CREATE VIEW "public"."vw_verification_codes" AS (select "hash", "created_at", 
      ("created_at" + "window")::TIMESTAMP
     as "expires_at", 
      (CASE
        WHEN "confirmed_at" IS NOT NULL THEN true
        ELSE NOW() > ("created_at" + "window")
      END)::BOOlEAN
     as "is_expired", "data" from "verification_codes");--> statement-breakpoint
CREATE VIEW "public"."vw_access_tokens" AS (select "user", (now() > ("created_at" + "window")::TIMESTAMP)::BOOLEAN OR revoked_at IS NOT NULL OR replaced_by IS NOT NULL as "is_expired", (created_at + "window")::TIMESTAMP as "expires_at", "created_at", "ip", "id" from "access_tokens");--> statement-breakpoint
CREATE VIEW "public"."vw_refresh_tokens" AS (select (now()::TIMESTAMP > ("created_at" + "window")::TIMESTAMP)::BOOLEAN OR "revoked_by" IS NOT NULL as "is_expired", ("created_at" + "window")::TIMESTAMP as "expires", "revoked_by", "replaced_by", "created_at", "access_token", "ip", "user", "token", "id" from "refresh_tokens");