CREATE TABLE "campaign_publications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campaign_publications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"campaign" bigint NOT NULL,
	"tokens" integer NOT NULL,
	"publish_after" date DEFAULT now(),
	"publish_before" date
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"media" text[],
	"links" text[],
	"emails" text[],
	"phones" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"categories" bigint[] NOT NULL,
	"created_by" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"image" varchar(500)
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
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"names" varchar(100) NOT NULL,
	"image_url" varchar(255),
	"email" varchar(100) NOT NULL,
	"dob" date,
	"phone" varchar(255),
	"credentials" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_publications" ADD CONSTRAINT "campaign_publications_campaign_campaigns_id_fk" FOREIGN KEY ("campaign") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_credentials_federated_credentials_id_fk" FOREIGN KEY ("credentials") REFERENCES "public"."federated_credentials"("id") ON DELETE no action ON UPDATE no action;