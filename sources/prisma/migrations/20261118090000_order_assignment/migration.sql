-- D7: gán đơn cho admin + vô hiệu hoá phiên cũ khi đổi mật khẩu.
-- `token_version` tăng mỗi lần đổi mật khẩu/khoá tài khoản; JWT mang số này
-- nên phiên cũ tự mất hiệu lực mà không cần lưu session server-side.

-- AlterTable
ALTER TABLE `admin_users` ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `assigned_admin_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `orders_assigned_admin_id_status_idx` ON `orders`(`assigned_admin_id`, `status`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_assigned_admin_id_fkey` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
