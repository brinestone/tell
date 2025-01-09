CREATE TYPE "public"."theme_pref" AS ENUM('system', 'dark', 'light');--> statement-breakpoint
CREATE TABLE "user_prefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user" bigint NOT NULL,
	"country" varchar(2) NOT NULL,
	"theme" "theme_pref" DEFAULT 'light',
	"currency" varchar(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_prefs" ADD CONSTRAINT "user_prefs_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;