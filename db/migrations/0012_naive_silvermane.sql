CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"window" interval NOT NULL,
	"code" varchar(6) NOT NULL,
	"confirmed_at" timestamp,
	"data" jsonb,
	CONSTRAINT "verification_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE VIEW "public"."vw_verification_codes" AS (select "code", "created_at", 
      ("created_at" + "window")::TIMESTAMP
     as "expires_at", 
      (CASE
        WHEN "confirmed_at" IS NOT NULL THEN true
        ELSE NOW() > ("created_at" + "window")
      END)::BOOlEAN
     as "is_expired", "data" from "verification_codes");