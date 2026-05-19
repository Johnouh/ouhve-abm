CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"check_in_time" timestamp NOT NULL,
	"check_out_time" timestamp,
	"date" timestamp NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "center_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_type" text NOT NULL,
	"program_id" integer NOT NULL,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"gender" text,
	"birth_date" text,
	"consultation_type" text NOT NULL,
	"custom_consultation_type" text,
	"consultation_date" timestamp NOT NULL,
	"purpose" text,
	"result" text,
	"counselor_id" integer,
	"method" text,
	"service" text,
	"notes" text,
	"status" text DEFAULT '진행 중' NOT NULL,
	"follow_up_date" timestamp,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"font_size" text DEFAULT '12',
	"font_family" text DEFAULT '돋움',
	"text_color" text DEFAULT '#000000',
	"background_color" text DEFAULT '#ffffff',
	"zoom" integer DEFAULT 100,
	"is_active" boolean DEFAULT true,
	"is_template" boolean DEFAULT false,
	"template_category" text,
	"last_edit_date" timestamp DEFAULT now() NOT NULL,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "franchises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"pg_provider" text,
	"pg_service_id" text,
	"pg_mode" text DEFAULT 'test',
	"pg_api_key" text,
	"pg_api_iv" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_extensions" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer,
	"member_name" text,
	"extension_type" text,
	"original_end_date" timestamp,
	"new_end_date" timestamp,
	"extension_days" integer NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_lesson_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"group_lesson_id" integer NOT NULL,
	"product_id" integer,
	"payment_id" integer,
	"price" integer DEFAULT 0,
	"enrollment_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT '활성' NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"instructor_id" integer,
	"instructor" text,
	"time" text,
	"start_time" text,
	"end_time" text,
	"duration" text,
	"day_of_week" integer DEFAULT 1 NOT NULL,
	"operating_days" text[] DEFAULT '{}',
	"color" text DEFAULT '#10B981' NOT NULL,
	"max_participants" integer DEFAULT 10 NOT NULL,
	"min_participants" integer DEFAULT 1,
	"participants" integer DEFAULT 0 NOT NULL,
	"capacity" text,
	"wait_list" text,
	"status" text DEFAULT '활성' NOT NULL,
	"notes" text,
	"price" integer DEFAULT 0,
	"product_id" integer,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kiosk_notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_payment_sms_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"franchise_id" integer NOT NULL,
	"pg_product_id" integer NOT NULL,
	"pg_transaction_id" integer,
	"sent_by_user_id" integer NOT NULL,
	"sent_by_username" text NOT NULL,
	"recipient_phone" text NOT NULL,
	"recipient_name" text,
	"link_url" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locker_recoveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"locker_id" integer NOT NULL,
	"locker_number" integer NOT NULL,
	"locker_section" text,
	"member_id" integer,
	"member_name" text,
	"recovery_date" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	"notes" text,
	"recovered_by" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locker_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_lockers" integer DEFAULT 100 NOT NULL,
	"sections" text[] DEFAULT '{"오전반","오후반","종일반"}' NOT NULL,
	"section_details" jsonb DEFAULT '[]'::jsonb,
	"default_monthly_fee" integer DEFAULT 10000 NOT NULL,
	"warning_days" integer DEFAULT 7 NOT NULL,
	"auto_expire_enabled" boolean DEFAULT true NOT NULL,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lockers" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"section" text DEFAULT '오전반' NOT NULL,
	"type" text DEFAULT '일반' NOT NULL,
	"status" text DEFAULT '빈 락커' NOT NULL,
	"member_id" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"monthly_fee" integer DEFAULT 0,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"equipment_name" text,
	"equipment_type" text,
	"rental_date" timestamp,
	"return_date" timestamp,
	"status" text DEFAULT '대여중' NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_lockers" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"locker_id" integer,
	"locker_section" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"monthly_fee" integer,
	"status" text DEFAULT '사용중' NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"measurement_date" timestamp DEFAULT now() NOT NULL,
	"weight" integer,
	"body_fat_percentage" integer,
	"muscle_mass" integer,
	"height" integer,
	"bmi" integer,
	"measurements" text,
	"notes" text,
	"measured_by" integer,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_modifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"modified_by" text,
	"modification_date" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT '활성 회원' NOT NULL,
	"gender" text,
	"birth_date" text,
	"address" text,
	"email" text,
	"emergency_contact" text,
	"occupation" text,
	"join_source" text,
	"notes" text,
	"join_date" timestamp DEFAULT now() NOT NULL,
	"last_visit" timestamp,
	"product_id" integer,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_sessions" integer,
	"used_sessions" integer DEFAULT 0,
	"price" integer NOT NULL,
	"instructor_id" integer,
	"status" text DEFAULT '활성' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ot_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"preferred_instructor_id" integer,
	"product_id" integer,
	"purchase_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"total_ot_sessions" integer NOT NULL,
	"preferred_schedule" text,
	"status" text DEFAULT '대기' NOT NULL,
	"application_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ot_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"program_type" text DEFAULT '개인' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"duration" integer,
	"sessions" integer,
	"max_participants" integer,
	"instructor_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "other_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_date" timestamp NOT NULL,
	"product_name" text NOT NULL,
	"customer_name" text,
	"payment_method" text DEFAULT '현금' NOT NULL,
	"period" text,
	"amount" integer NOT NULL,
	"staff_id" integer,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"membership_id" integer,
	"amount" integer NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT '완료' NOT NULL,
	"description" text,
	"staff_id" integer,
	"product_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"franchise_id" integer
);
--> statement-breakpoint
CREATE TABLE "personal_training" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"instructor_id" integer,
	"product_id" integer,
	"total_sessions" integer NOT NULL,
	"remaining_sessions" integer NOT NULL,
	"used_sessions" integer DEFAULT 0,
	"purchase_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"last_session_date" timestamp,
	"scheduled_days" text[],
	"preferred_start_time" text,
	"preferred_end_time" text,
	"status" text DEFAULT '활성' NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pg_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"franchise_id" integer NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"item_code" text NOT NULL,
	"description" text,
	"category" text DEFAULT '기타',
	"is_active" boolean DEFAULT true NOT NULL,
	"link_payment_url" text,
	"order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pg_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"franchise_id" integer NOT NULL,
	"member_id" integer,
	"payment_id" integer,
	"order_id" text NOT NULL,
	"order_date" text NOT NULL,
	"transaction_id" text,
	"service_code" text DEFAULT '0900' NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"response_code" text,
	"response_message" text,
	"auth_number" text,
	"auth_date" text,
	"payment_method" text,
	"item_name" text,
	"item_code" text,
	"user_name" text,
	"user_phone" text,
	"user_email" text,
	"cancel_type" text,
	"cancel_amount" integer,
	"cancel_date" text,
	"link_payment_url" text,
	"pg_provider" text DEFAULT 'billgate' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author" text DEFAULT '관리자' NOT NULL,
	"is_important" boolean DEFAULT false,
	"status" text DEFAULT '게시' NOT NULL,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"duration" integer,
	"duration_type" text DEFAULT '월' NOT NULL,
	"sessions" integer,
	"category" text DEFAULT '회원권' NOT NULL,
	"description" text,
	"status" text DEFAULT '활성' NOT NULL,
	"app_exposed" boolean DEFAULT true NOT NULL,
	"franchise_id" integer,
	"instructor_id" integer,
	"lesson_type" text,
	"max_participants" integer,
	"min_participants" integer,
	"start_time" text,
	"end_time" text,
	"operating_days" text[],
	"locker_section" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"pt_id" integer NOT NULL,
	"instructor_id" integer NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"actual_date" timestamp,
	"duration" integer DEFAULT 60,
	"status" text DEFAULT '예약' NOT NULL,
	"session_notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"member_name" text,
	"refund_date" timestamp DEFAULT now() NOT NULL,
	"original_amount" integer,
	"refund_amount" integer NOT NULL,
	"refund_reason" text NOT NULL,
	"product_name" text,
	"product_type" text,
	"product_id" integer,
	"status" text DEFAULT '요청' NOT NULL,
	"notes" text,
	"processed_by" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructor_id" integer,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"position" text NOT NULL,
	"department" text,
	"hire_date" timestamp NOT NULL,
	"resignation_date" timestamp,
	"birth_date" text,
	"address" text,
	"emergency_contact" text,
	"salary" integer,
	"work_type" text DEFAULT '정규직' NOT NULL,
	"work_days" text[],
	"work_hours" text,
	"specialties" text[],
	"certifications" text[],
	"status" text DEFAULT '재직' NOT NULL,
	"approval_status" text DEFAULT '대기' NOT NULL,
	"notes" text,
	"profile_image" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suspensions" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"member_name" text,
	"membership_id" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"reason" text NOT NULL,
	"status" text DEFAULT '활성' NOT NULL,
	"notes" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"trainer_id" integer NOT NULL,
	"record_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"record_date" timestamp DEFAULT now() NOT NULL,
	"attachments" text[],
	"tags" text[],
	"is_private" boolean DEFAULT false,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"name" text,
	"phone" text,
	"franchise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_programs" ADD CONSTRAINT "center_programs_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_counselor_id_staff_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_extensions" ADD CONSTRAINT "group_extensions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_extensions" ADD CONSTRAINT "group_extensions_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lesson_enrollments" ADD CONSTRAINT "group_lesson_enrollments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lesson_enrollments" ADD CONSTRAINT "group_lesson_enrollments_group_lesson_id_group_lessons_id_fk" FOREIGN KEY ("group_lesson_id") REFERENCES "public"."group_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lesson_enrollments" ADD CONSTRAINT "group_lesson_enrollments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lesson_enrollments" ADD CONSTRAINT "group_lesson_enrollments_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lesson_enrollments" ADD CONSTRAINT "group_lesson_enrollments_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lessons" ADD CONSTRAINT "group_lessons_instructor_id_staff_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lessons" ADD CONSTRAINT "group_lessons_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_lessons" ADD CONSTRAINT "group_lessons_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_notices" ADD CONSTRAINT "kiosk_notices_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_payment_sms_logs" ADD CONSTRAINT "link_payment_sms_logs_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_payment_sms_logs" ADD CONSTRAINT "link_payment_sms_logs_pg_product_id_pg_products_id_fk" FOREIGN KEY ("pg_product_id") REFERENCES "public"."pg_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_payment_sms_logs" ADD CONSTRAINT "link_payment_sms_logs_pg_transaction_id_pg_transactions_id_fk" FOREIGN KEY ("pg_transaction_id") REFERENCES "public"."pg_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_payment_sms_logs" ADD CONSTRAINT "link_payment_sms_logs_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locker_recoveries" ADD CONSTRAINT "locker_recoveries_locker_id_lockers_id_fk" FOREIGN KEY ("locker_id") REFERENCES "public"."lockers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locker_recoveries" ADD CONSTRAINT "locker_recoveries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locker_recoveries" ADD CONSTRAINT "locker_recoveries_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locker_settings" ADD CONSTRAINT "locker_settings_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_equipment" ADD CONSTRAINT "member_equipment_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_equipment" ADD CONSTRAINT "member_equipment_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_lockers" ADD CONSTRAINT "member_lockers_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_lockers" ADD CONSTRAINT "member_lockers_locker_id_lockers_id_fk" FOREIGN KEY ("locker_id") REFERENCES "public"."lockers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_lockers" ADD CONSTRAINT "member_lockers_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_measurements" ADD CONSTRAINT "member_measurements_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_measurements" ADD CONSTRAINT "member_measurements_measured_by_staff_id_fk" FOREIGN KEY ("measured_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_measurements" ADD CONSTRAINT "member_measurements_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_modifications" ADD CONSTRAINT "member_modifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_modifications" ADD CONSTRAINT "member_modifications_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_instructor_id_staff_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ot_applications" ADD CONSTRAINT "ot_applications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ot_applications" ADD CONSTRAINT "ot_applications_preferred_instructor_id_staff_id_fk" FOREIGN KEY ("preferred_instructor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ot_applications" ADD CONSTRAINT "ot_applications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ot_applications" ADD CONSTRAINT "ot_applications_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ot_programs" ADD CONSTRAINT "ot_programs_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_sales" ADD CONSTRAINT "other_sales_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_sales" ADD CONSTRAINT "other_sales_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_training" ADD CONSTRAINT "personal_training_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_training" ADD CONSTRAINT "personal_training_instructor_id_staff_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_training" ADD CONSTRAINT "personal_training_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_training" ADD CONSTRAINT "personal_training_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_products" ADD CONSTRAINT "pg_products_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_transactions" ADD CONSTRAINT "pg_transactions_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_transactions" ADD CONSTRAINT "pg_transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_transactions" ADD CONSTRAINT "pg_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_pt_id_personal_training_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."personal_training"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_instructor_id_staff_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instructor_id_staff_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensions" ADD CONSTRAINT "suspensions_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_records" ADD CONSTRAINT "trainer_records_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_records" ADD CONSTRAINT "trainer_records_trainer_id_staff_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_records" ADD CONSTRAINT "trainer_records_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE no action ON UPDATE no action;