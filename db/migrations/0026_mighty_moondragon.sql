ALTER TABLE "campaigns" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "categories" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "redirect_url" DROP NOT NULL;