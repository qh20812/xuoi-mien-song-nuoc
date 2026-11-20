-- AlterTable
ALTER TABLE `media` ADD COLUMN `public_id` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `media_public_id_key` ON `media`(`public_id`);
