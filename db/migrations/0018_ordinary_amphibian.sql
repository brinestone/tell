CREATE TYPE "public"."payment_method_status" AS ENUM('active', 'inactive', 're-connection required');--> statement-breakpoint
ALTER TYPE "public"."payment_methods_types" RENAME TO "payment_method_provider";--> statement-breakpoint
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
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;