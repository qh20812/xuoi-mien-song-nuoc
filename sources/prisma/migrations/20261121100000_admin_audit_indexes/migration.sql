-- CreateIndex
CREATE INDEX `admin_audit_logs_created_at_idx` ON `admin_audit_logs`(`created_at`);

-- CreateIndex
CREATE INDEX `admin_audit_logs_admin_id_created_at_idx` ON `admin_audit_logs`(`admin_id`, `created_at`);

-- CreateIndex
CREATE INDEX `admin_audit_logs_action_created_at_idx` ON `admin_audit_logs`(`action`, `created_at`);

-- CreateIndex
CREATE INDEX `admin_audit_logs_entity_created_at_idx` ON `admin_audit_logs`(`entity`, `created_at`);
