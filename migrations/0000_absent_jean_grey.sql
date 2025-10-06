CREATE TYPE "public"."agent_tool_status" AS ENUM('enabled', 'disabled', 'testing');--> statement-breakpoint
CREATE TYPE "public"."audit_action_type" AS ENUM('create', 'update', 'delete', 'feature', 'unfeature', 'export', 'import', 'configure_tool', 'test_integration', 'bulk_operation');--> statement-breakpoint
CREATE TYPE "public"."build_pro_status" AS ENUM('not_offered', 'offered', 'trial', 'subscribed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('unclaimed', 'claimed', 'verified');--> statement-breakpoint
CREATE TYPE "public"."credit_purchase_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('varchar', 'text', 'integer', 'boolean', 'timestamp', 'enum');--> statement-breakpoint
CREATE TYPE "public"."duplicate_strategy" AS ENUM('skip', 'update', 'create_new');--> statement-breakpoint
CREATE TYPE "public"."enterprise_category" AS ENUM('land_projects', 'capital_sources', 'open_source_tools', 'network_organizers');--> statement-breakpoint
CREATE TYPE "public"."enterprise_invitation_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."external_entity_type" AS ENUM('enterprise', 'person', 'opportunity');--> statement-breakpoint
CREATE TYPE "public"."external_provider" AS ENUM('apollo', 'google_maps', 'foursquare', 'pipedrive', 'twenty_crm');--> statement-breakpoint
CREATE TYPE "public"."import_entity_type" AS ENUM('enterprise', 'person', 'opportunity');--> statement-breakpoint
CREATE TYPE "public"."import_error_type" AS ENUM('validation', 'duplicate', 'system');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('uploaded', 'mapping', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."integration_config_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('not_invited', 'invited', 'signed_up', 'active');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('free', 'trial', 'paid_member', 'spatial_network_subscriber', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."ownership_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."partner_application_status" AS ENUM('pending', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('free', 'crm_basic', 'crm_pro', 'build_pro_bundle');--> statement-breakpoint
CREATE TYPE "public"."pledge_status" AS ENUM('pending', 'affirmed', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."profile_claim_status" AS ENUM('pending', 'claimed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('pending', 'published', 'error');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired');--> statement-breakpoint
CREATE TYPE "public"."support_status" AS ENUM('no_inquiry', 'inquiry_sent', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."sync_job_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_job_type" AS ENUM('import', 'export', 'sync', 'refresh');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'synced', 'failed', 'stale');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('viewer', 'editor', 'admin', 'owner');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'accepted', 'declined', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('free', 'crm_pro', 'admin');--> statement-breakpoint
CREATE TABLE "agent_tools" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"function_definition" jsonb NOT NULL,
	"integration_config_id" varchar,
	"status" "agent_tool_status" DEFAULT 'enabled' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"last_error" text,
	"average_execution_time_ms" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_tools_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar,
	"subscription_id" varchar,
	"operation_type" varchar NOT NULL,
	"model_used" varchar,
	"tokens_prompt" integer NOT NULL,
	"tokens_completion" integer,
	"provider_cost" integer,
	"cost" integer,
	"entity_type" varchar,
	"entity_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar,
	"action_type" "audit_action_type" NOT NULL,
	"table_name" varchar,
	"record_id" varchar,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_context" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"company_name" varchar,
	"website" varchar,
	"description" text,
	"awards" text,
	"outreach_goal" text,
	"customer_profiles" jsonb,
	"guidance_rules" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"title" varchar,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copilot_context" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"lead_scoring_criteria" jsonb,
	"automation_rules" jsonb,
	"focus_areas" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"stripe_payment_intent_id" varchar,
	"stripe_price_id" varchar,
	"status" "credit_purchase_status" DEFAULT 'pending' NOT NULL,
	"purchased_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"entity_name" varchar NOT NULL,
	"field_name" varchar NOT NULL,
	"field_type" "custom_field_type" NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT false,
	"is_unique" boolean DEFAULT false,
	"enum_values" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "earth_care_pledges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"status" "pledge_status" DEFAULT 'pending' NOT NULL,
	"earth_care" boolean DEFAULT false,
	"people_care" boolean DEFAULT false,
	"fair_share" boolean DEFAULT false,
	"narrative" text,
	"signed_at" timestamp NOT NULL,
	"signed_by" varchar NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" "team_member_role" NOT NULL,
	"inviter_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_by" varchar,
	"accepted_at" timestamp,
	"status" "enterprise_invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "enterprise_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "enterprise_owners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "ownership_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "team_member_role" NOT NULL,
	"invited_by" varchar,
	"invited_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"status" "team_member_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" "enterprise_category" NOT NULL,
	"location" varchar,
	"website" varchar,
	"image_url" varchar,
	"is_verified" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" integer DEFAULT 999999 NOT NULL,
	"featured_at" timestamp,
	"follower_count" integer DEFAULT 0,
	"tags" text[],
	"contact_email" varchar,
	"source_url" varchar,
	"external_source_ref" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_api_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" "external_provider" NOT NULL,
	"token_data" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_entities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "external_provider" NOT NULL,
	"external_id" varchar NOT NULL,
	"entity_type" "external_entity_type" NOT NULL,
	"internal_id" varchar,
	"metadata" jsonb,
	"sync_status" "sync_status" DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_search_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "external_provider" NOT NULL,
	"query_key" text NOT NULL,
	"query_params" jsonb NOT NULL,
	"result_data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_sync_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"provider" "external_provider" NOT NULL,
	"job_type" "sync_job_type" NOT NULL,
	"status" "sync_job_status" DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"total_records" integer,
	"processed_records" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_job_errors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"row_number" integer NOT NULL,
	"row_data" jsonb NOT NULL,
	"error_message" text NOT NULL,
	"error_type" "import_error_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"entity_type" "import_entity_type" NOT NULL,
	"status" "import_status" DEFAULT 'uploaded' NOT NULL,
	"file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"file_buffer" "bytea",
	"total_rows" integer,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"successful_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"mapping_config" jsonb,
	"duplicate_strategy" "duplicate_strategy" DEFAULT 'skip' NOT NULL,
	"error_summary" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instance_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_name" varchar,
	"instance_url" varchar,
	"murmurations_enabled" boolean DEFAULT true,
	"publish_to_global_index" boolean DEFAULT true,
	"contact_email" varchar,
	"description" text,
	"logo_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"api_key" text,
	"api_secret" text,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"status" "integration_config_status" DEFAULT 'inactive' NOT NULL,
	"last_tested_at" timestamp,
	"test_result" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "integration_configs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"display_name" varchar,
	"bio" text,
	"expertise" text[],
	"website" varchar,
	"linkedin_url" varchar,
	"twitter_url" varchar,
	"location" varchar,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "member_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "murmurations_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"profile_url" varchar NOT NULL,
	"murmurations_node_id" varchar,
	"linked_schemas" text[],
	"last_submitted_at" timestamp,
	"last_indexed_at" timestamp,
	"status" "profile_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"value" integer,
	"status" "opportunity_status" DEFAULT 'lead',
	"probability" integer DEFAULT 0,
	"enterprise_id" varchar,
	"primary_contact_id" varchar,
	"expected_close_date" timestamp,
	"notes" text,
	"ai_score" integer,
	"ai_insights" text,
	"external_source_ref" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunity_transfers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" varchar NOT NULL,
	"transferred_by" varchar NOT NULL,
	"transferred_to" varchar NOT NULL,
	"previous_owner_id" varchar,
	"status" "transfer_status" DEFAULT 'pending',
	"reason" text,
	"notes" text,
	"transferred_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_name" varchar NOT NULL,
	"contact_person" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"website" varchar,
	"description" text,
	"areas_of_focus" text[],
	"contribution" text,
	"status" "partner_application_status" DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"title" varchar,
	"enterprise_id" varchar,
	"linkedin_url" varchar,
	"notes" text,
	"invitation_status" "invitation_status" DEFAULT 'not_invited',
	"claim_status" "claim_status" DEFAULT 'unclaimed',
	"build_pro_status" "build_pro_status" DEFAULT 'not_offered',
	"support_status" "support_status" DEFAULT 'no_inquiry',
	"last_contacted_at" timestamp,
	"external_source_ref" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "people_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "profile_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"claim_token" varchar NOT NULL,
	"invited_email" varchar NOT NULL,
	"invited_name" varchar,
	"status" "profile_claim_status" DEFAULT 'pending' NOT NULL,
	"invited_by" varchar NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"claimed_by" varchar,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profile_claims_claim_token_unique" UNIQUE("claim_token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_type" "plan_type" NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price_monthly" integer NOT NULL,
	"price_yearly" integer,
	"stripe_price_id_monthly" varchar,
	"stripe_price_id_yearly" varchar,
	"features" text[],
	"credit_allocation" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_plans_plan_type_unique" UNIQUE("plan_type")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"stripe_subscription_id" varchar,
	"stripe_customer_id" varchar NOT NULL,
	"stripe_price_id" varchar NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"is_yearly" boolean DEFAULT false,
	"last_payment_amount" integer,
	"last_payment_at" timestamp,
	"next_billing_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"priority" "task_priority" DEFAULT 'medium',
	"status" "task_status" DEFAULT 'pending',
	"due_date" timestamp,
	"assigned_to_id" varchar,
	"enterprise_id" varchar,
	"related_person_id" varchar,
	"related_opportunity_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"enterprise_id" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'free',
	"membership_status" "membership_status" DEFAULT 'free',
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" "subscription_status",
	"current_plan_type" "plan_type" DEFAULT 'free',
	"subscription_current_period_end" timestamp,
	"credit_balance" integer DEFAULT 0,
	"credit_limit" integer DEFAULT 10,
	"monthly_allocation" integer DEFAULT 10,
	"credit_reset_date" timestamp,
	"overage_allowed" boolean DEFAULT false,
	"max_claimed_profiles" integer DEFAULT 1,
	"claimed_profiles_count" integer DEFAULT 0,
	"onboarding_progress" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_integration_config_id_integration_configs_id_fk" FOREIGN KEY ("integration_config_id") REFERENCES "public"."integration_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_context" ADD CONSTRAINT "business_context_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_context" ADD CONSTRAINT "business_context_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_context" ADD CONSTRAINT "copilot_context_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_context" ADD CONSTRAINT "copilot_context_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earth_care_pledges" ADD CONSTRAINT "earth_care_pledges_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earth_care_pledges" ADD CONSTRAINT "earth_care_pledges_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earth_care_pledges" ADD CONSTRAINT "earth_care_pledges_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_invitations" ADD CONSTRAINT "enterprise_invitations_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_invitations" ADD CONSTRAINT "enterprise_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_invitations" ADD CONSTRAINT "enterprise_invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_owners" ADD CONSTRAINT "enterprise_owners_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_owners" ADD CONSTRAINT "enterprise_owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_team_members" ADD CONSTRAINT "enterprise_team_members_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_team_members" ADD CONSTRAINT "enterprise_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_team_members" ADD CONSTRAINT "enterprise_team_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_api_tokens" ADD CONSTRAINT "external_api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_jobs" ADD CONSTRAINT "external_sync_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_jobs" ADD CONSTRAINT "external_sync_jobs_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_job_errors" ADD CONSTRAINT "import_job_errors_job_id_import_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "murmurations_profiles" ADD CONSTRAINT "murmurations_profiles_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_primary_contact_id_people_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_transfers" ADD CONSTRAINT "opportunity_transfers_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_transfers" ADD CONSTRAINT "opportunity_transfers_transferred_by_users_id_fk" FOREIGN KEY ("transferred_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_transfers" ADD CONSTRAINT "opportunity_transfers_transferred_to_users_id_fk" FOREIGN KEY ("transferred_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_transfers" ADD CONSTRAINT "opportunity_transfers_previous_owner_id_users_id_fk" FOREIGN KEY ("previous_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_related_person_id_people_id_fk" FOREIGN KEY ("related_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_related_opportunity_id_opportunities_id_fk" FOREIGN KEY ("related_opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_tools_status_idx" ON "agent_tools" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_tools_category_idx" ON "agent_tools" USING btree ("category");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_enterprise_id_idx" ON "audit_logs" USING btree ("enterprise_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "audit_logs_table_name_idx" ON "audit_logs" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_composite_idx" ON "audit_logs" USING btree ("action_type","table_name","created_at");--> statement-breakpoint
CREATE INDEX "custom_fields_entity_field_idx" ON "custom_fields" USING btree ("entity_name","field_name");--> statement-breakpoint
CREATE INDEX "enterprise_invitations_unique_pending_idx" ON "enterprise_invitations" USING btree ("enterprise_id","email") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "enterprise_owners_unique_idx" ON "enterprise_owners" USING btree ("enterprise_id","user_id");--> statement-breakpoint
CREATE INDEX "enterprise_team_members_unique_idx" ON "enterprise_team_members" USING btree ("enterprise_id","user_id");--> statement-breakpoint
CREATE INDEX "enterprises_featured_idx" ON "enterprises" USING btree ("is_featured","featured_order");--> statement-breakpoint
CREATE INDEX "external_entities_provider_external_id_idx" ON "external_entities" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "integration_configs_status_idx" ON "integration_configs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "user_favorites_unique_idx" ON "user_favorites" USING btree ("user_id","enterprise_id");