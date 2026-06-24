ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DATA TYPE "public"."roles_enum"[] USING "roles"::text::"public"."roles_enum"[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{"Normal"}';