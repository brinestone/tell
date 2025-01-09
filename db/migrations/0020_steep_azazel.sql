ALTER TABLE "campaign_publications" DROP CONSTRAINT "campaign_publications_campaign_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_owner_users_id_fk";
--> statement-breakpoint
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_owned_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_publications" ADD CONSTRAINT "campaign_publications_campaign_campaigns_id_fk" FOREIGN KEY ("campaign") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_owned_by_users_id_fk" FOREIGN KEY ("owned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;