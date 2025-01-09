CREATE TYPE "public"."account_connection_providers" AS ENUM('telegram');--> statement-breakpoint
CREATE TABLE "account_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user" bigint NOT NULL,
	"provider" "account_connection_providers" NOT NULL,
	"params" jsonb NOT NULL,
	"is_valid" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "account_transactions" RENAME COLUMN "payment_method_extras" TO "params";--> statement-breakpoint
ALTER TABLE "account_connections" ADD CONSTRAINT "account_connections_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;