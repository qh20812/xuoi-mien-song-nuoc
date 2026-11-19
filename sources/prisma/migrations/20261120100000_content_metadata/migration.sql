-- AlterTable
ALTER TABLE `faqs` ADD COLUMN `placement` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `checklist` JSON NULL,
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `related_tour_codes` JSON NULL,
    ADD COLUMN `topic` VARCHAR(40) NULL;
