CREATE TABLE "access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" varchar(39) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"window" interval NOT NULL,
	"replaced_by" uuid
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
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_replaced_by_access_tokens_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."access_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_refresh_tokens_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."refresh_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_access_token_access_tokens_id_fk" FOREIGN KEY ("access_token") REFERENCES "public"."access_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_user_index" ON "refresh_tokens" USING btree ("token","user");--> statement-breakpoint
CREATE VIEW "public"."vw_refresh_tokens" AS (select (created_at + "window")::TIMESTAMP as "expires", "revoked_by", "replaced_by", "created_at", "access_token", "ip", "user", "token", "id" from "refresh_tokens");