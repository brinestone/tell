DROP VIEW "public"."vw_verification_codes";--> statement-breakpoint
ALTER TABLE "verification_codes" DROP CONSTRAINT "verification_codes_code_unique";--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "hash" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_codes" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_hash_unique" UNIQUE("hash");--> statement-breakpoint
CREATE VIEW "public"."vw_verification_codes" AS (select "hash", "created_at", 
      ("created_at" + "window")::TIMESTAMP
     as "expires_at", 
      (CASE
        WHEN "confirmed_at" IS NOT NULL THEN true
        ELSE NOW() > ("created_at" + "window")
      END)::BOOlEAN
     as "is_expired", "data" from "verification_codes");