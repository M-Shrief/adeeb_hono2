CREATE TYPE "public"."order_status_enum" AS ENUM('in progress', 'completed', 'aborted');--> statement-breakpoint
CREATE TYPE "public"."outfit_type_enum" AS ENUM('تيشيرت - لياقة 7', 'تيشيرت - نص لياقة ', 'تشيرت - لياقة بولو', 'جاكيت', 'سويت شيرت', 'بلوفر');--> statement-breakpoint
CREATE TYPE "public"."roles_enum" AS ENUM('Normal', 'Management', 'DBA', 'Analytics', 'Banned');--> statement-breakpoint
CREATE TYPE "public"."time_period_enum" AS ENUM('غير محدد', 'جاهلي', 'أموي', 'عباسي', 'أندلسي', 'عثماني ومملوكي', 'حديث');--> statement-breakpoint
CREATE TABLE "adeebs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"bio" varchar(1024) NOT NULL,
	"time_period" time_period_enum DEFAULT 'غير محدد',
	"reviewed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "adeebs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "chosen_verses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tags" varchar(64)[] DEFAULT '{}'::VARCHAR[] NOT NULL,
	"verses" varchar(256)[] NOT NULL,
	"is_couplet" boolean DEFAULT true NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"adeeb_id" uuid NOT NULL,
	"poem_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(128) NOT NULL,
	"phone" varchar(128) NOT NULL,
	"address" varchar(256) NOT NULL,
	"delivery_schedule" timestamp,
	"is_updateable" boolean DEFAULT true NOT NULL,
	"status" "order_status_enum" DEFAULT 'in progress' NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intro" varchar(256) NOT NULL,
	"verses" varchar(256)[] NOT NULL,
	"is_couplet" boolean DEFAULT true NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"adeeb_id" uuid NOT NULL,
	CONSTRAINT "poems_intro_unique" UNIQUE("intro")
);
--> statement-breakpoint
CREATE TABLE "prints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"font_type" varchar(64) NOT NULL,
	"font_color" varchar(64) NOT NULL,
	"outfit_type" "outfit_type_enum" NOT NULL,
	"outfit_color" varchar(64) NOT NULL,
	"qoute" varchar(512),
	"verses" varchar(256)[],
	"is_couplet" boolean,
	"order_id" uuid NOT NULL,
	"user_id" uuid,
	"poem_id" uuid,
	"chosen_verse_id" uuid,
	"prose_qoute_id" uuid
);
--> statement-breakpoint
CREATE TABLE "prose_qoutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qoute" varchar(512) NOT NULL,
	"source" varchar(128),
	"tags" varchar(64)[] DEFAULT '{}'::VARCHAR[] NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"adeeb_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"roles" "roles_enum" DEFAULT 'Normal' NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "chosen_verses" ADD CONSTRAINT "chosen_verses_adeeb_id_adeebs_id_fk" FOREIGN KEY ("adeeb_id") REFERENCES "public"."adeebs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chosen_verses" ADD CONSTRAINT "chosen_verses_poem_id_poems_id_fk" FOREIGN KEY ("poem_id") REFERENCES "public"."poems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poems" ADD CONSTRAINT "poems_adeeb_id_adeebs_id_fk" FOREIGN KEY ("adeeb_id") REFERENCES "public"."adeebs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prints" ADD CONSTRAINT "prints_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prints" ADD CONSTRAINT "prints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prints" ADD CONSTRAINT "prints_poem_id_poems_id_fk" FOREIGN KEY ("poem_id") REFERENCES "public"."poems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prints" ADD CONSTRAINT "prints_chosen_verse_id_chosen_verses_id_fk" FOREIGN KEY ("chosen_verse_id") REFERENCES "public"."chosen_verses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prints" ADD CONSTRAINT "prints_prose_qoute_id_prose_qoutes_id_fk" FOREIGN KEY ("prose_qoute_id") REFERENCES "public"."prose_qoutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prose_qoutes" ADD CONSTRAINT "prose_qoutes_adeeb_id_adeebs_id_fk" FOREIGN KEY ("adeeb_id") REFERENCES "public"."adeebs"("id") ON DELETE no action ON UPDATE no action;