DROP VIEW "public"."vw_refresh_tokens";--> statement-breakpoint
ALTER TABLE "access_tokens" ADD COLUMN "user" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."vw_access_tokens" AS (select "user", (now() > (created_at + "window")::TIMESTAMP)::BOOLEAN OR replaced_by IS NOT NULL as "is_expired", (created_at + "window")::TIMESTAMP as "expires_at", "created_at", "ip", "id" from "access_tokens");--> statement-breakpoint
CREATE VIEW "public"."vw_refresh_tokens" AS (select (now()::TIMESTAMP > (created_at + "window")::TIMESTAMP)::BOOLEAN as "is_expired", (created_at + "window")::TIMESTAMP as "expires", "revoked_by", "replaced_by", "created_at", "access_token", "ip", "user", "token", "id" from "refresh_tokens");