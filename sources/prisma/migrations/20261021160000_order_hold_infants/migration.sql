-- AlterTable
ALTER TABLE `order_passengers` MODIFY `type` ENUM('adult', 'child', 'infant') NOT NULL;

-- AlterTable
ALTER TABLE `order_status_history` MODIFY `from_status` ENUM('new', 'pending', 'confirmed', 'completed', 'cancelled', 'expired') NULL,
    MODIFY `to_status` ENUM('new', 'pending', 'confirmed', 'completed', 'cancelled', 'expired') NOT NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `client_request_id` CHAR(36) NULL,
    ADD COLUMN `hold_expires_at` DATETIME(3) NULL,
    ADD COLUMN `infants` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('new', 'pending', 'confirmed', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE UNIQUE INDEX `orders_client_request_id_key` ON `orders`(`client_request_id`);

-- CreateIndex
CREATE INDEX `orders_status_hold_expires_at_idx` ON `orders`(`status`, `hold_expires_at`);

-- CHECK constraints (not expressible in the Prisma schema)
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_rating_check` CHECK (`rating` BETWEEN 1 AND 5);
ALTER TABLE `tour_departures` ADD CONSTRAINT `tour_departures_seats_check` CHECK (`seats_taken` <= `capacity_total`);
ALTER TABLE `orders` ADD CONSTRAINT `orders_adults_check` CHECK (`adults` >= 1);
ALTER TABLE `orders` ADD CONSTRAINT `orders_total_amount_check` CHECK (`total_amount` >= 0);
