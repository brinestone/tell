ALTER TABLE "account_connections" DROP CONSTRAINT "account_connections_user_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_prefs" ALTER COLUMN "theme" SET DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "account_connections" ADD COLUMN "provider_id" varchar(255) NOT NULL;