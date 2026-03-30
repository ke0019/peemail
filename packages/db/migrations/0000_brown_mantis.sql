CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_hash" text NOT NULL,
	"identity_key_hash" text,
	"nickname" text NOT NULL,
	"avatar_animal" text NOT NULL,
	"avatar_color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"banned_at" timestamp with time zone,
	CONSTRAINT "devices_device_hash_unique" UNIQUE("device_hash"),
	CONSTRAINT "devices_identity_key_hash_unique" UNIQUE("identity_key_hash")
);
--> statement-breakpoint
CREATE TABLE "pins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"content" text NOT NULL,
	"location" geography(Point, 4326) NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"vote_up_count" integer DEFAULT 0 NOT NULL,
	"vote_down_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"pin_type" text DEFAULT 'user' NOT NULL,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pins_content_length" CHECK (char_length("pins"."content") <= 280),
	CONSTRAINT "pins_pin_type" CHECK ("pins"."pin_type" IN ('user', 'official'))
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pin_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "replies_content_length" CHECK (char_length("replies"."content") <= 280)
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"pin_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_pin_id_device_id_pk" PRIMARY KEY("pin_id","device_id"),
	CONSTRAINT "votes_value" CHECK ("votes"."value" IN (1, -1))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"venue_boundary" geography(Polygon, 4326) NOT NULL,
	"personal_pin_ttl" integer DEFAULT 21600 NOT NULL,
	"contract_ends_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_status" CHECK ("events"."status" IN ('active', 'hidden'))
);
--> statement-breakpoint
CREATE TABLE "archived_pin_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"official_pin_id" uuid NOT NULL,
	"original_pin_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"content" text NOT NULL,
	"original_at" timestamp with time zone NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_device_id" uuid NOT NULL,
	"blocked_device_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_blocker_device_id_blocked_device_id_pk" PRIMARY KEY("blocker_device_id","blocked_device_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"pin_id" uuid,
	"reply_id" uuid,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_status" CHECK ("reports"."status" IN ('pending', 'reviewed', 'dismissed')),
	CONSTRAINT "reports_reason" CHECK ("reports"."reason" IN ('spam', 'offensive', 'misleading', 'other'))
);
--> statement-breakpoint
CREATE TABLE "motion_room_members" (
	"room_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "motion_room_members_room_id_device_id_pk" PRIMARY KEY("room_id","device_id"),
	CONSTRAINT "motion_room_members_role" CHECK ("motion_room_members"."role" IN ('creator', 'member'))
);
--> statement-breakpoint
CREATE TABLE "motion_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "motion_rooms_status" CHECK ("motion_rooms"."status" IN ('active', 'converted', 'dissolved'))
);
--> statement-breakpoint
CREATE TABLE "phone_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_hash" text NOT NULL,
	"device_id" uuid NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pins" ADD CONSTRAINT "pins_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pins" ADD CONSTRAINT "pins_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_pin_id_pins_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."pins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_parent_id_replies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_pin_id_pins_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."pins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_pin_contents" ADD CONSTRAINT "archived_pin_contents_official_pin_id_pins_id_fk" FOREIGN KEY ("official_pin_id") REFERENCES "public"."pins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_pin_contents" ADD CONSTRAINT "archived_pin_contents_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_device_id_devices_id_fk" FOREIGN KEY ("blocker_device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_device_id_devices_id_fk" FOREIGN KEY ("blocked_device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_devices_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_pin_id_pins_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."pins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reply_id_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motion_room_members" ADD CONSTRAINT "motion_room_members_room_id_motion_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."motion_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motion_room_members" ADD CONSTRAINT "motion_room_members_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motion_rooms" ADD CONSTRAINT "motion_rooms_creator_id_devices_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_verifications" ADD CONSTRAINT "phone_verifications_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pins_location_idx" ON "pins" USING gist ("location");--> statement-breakpoint
CREATE INDEX "pins_expires_at_idx" ON "pins" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pins_event_id_idx" ON "pins" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "replies_pin_id_idx" ON "replies" USING btree ("pin_id");--> statement-breakpoint
CREATE INDEX "events_venue_idx" ON "events" USING gist ("venue_boundary");--> statement-breakpoint
CREATE INDEX "archived_official_pin_idx" ON "archived_pin_contents" USING btree ("official_pin_id");