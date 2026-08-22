CREATE INDEX "project_members_org_member_id_project_id_idx" ON "project_members" USING btree ("org_member_id","project_id");--> statement-breakpoint
CREATE INDEX "flags_project_id_idx" ON "flags" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "environments_project_id_idx" ON "environments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "flag_environments_environment_id_flag_id_idx" ON "flag_environments" USING btree ("environment_id","flag_id");--> statement-breakpoint
CREATE INDEX "flag_history_project_id_created_at_idx" ON "flag_history" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "flag_history_flag_id_created_at_idx" ON "flag_history" USING btree ("flag_id","created_at");--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_user_id_unique" UNIQUE("org_id","user_id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_slug_unique" UNIQUE("org_id","slug");--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_project_id_key_unique" UNIQUE("project_id","key");--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_org_id_email_unique" UNIQUE("org_id","email");