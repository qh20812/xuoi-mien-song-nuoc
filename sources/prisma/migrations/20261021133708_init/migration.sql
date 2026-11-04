-- CreateTable
CREATE TABLE `tours` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `tagline` VARCHAR(255) NULL,
    `summary` TEXT NULL,
    `description` MEDIUMTEXT NULL,
    `duration_days` SMALLINT UNSIGNED NOT NULL,
    `duration_nights` SMALLINT UNSIGNED NOT NULL,
    `base_price_adult` INTEGER NOT NULL,
    `base_price_child` INTEGER NOT NULL DEFAULT 0,
    `child_age_note` VARCHAR(255) NULL,
    `highlights` JSON NULL,
    `includes` JSON NULL,
    `excludes` JSON NULL,
    `cancellation_policy` TEXT NULL,
    `packing_notes` TEXT NULL,
    `cover_image_url` VARCHAR(500) NULL,
    `gallery` JSON NULL,
    `seo_title` VARCHAR(200) NULL,
    `seo_description` VARCHAR(320) NULL,
    `og_image_url` VARCHAR(500) NULL,
    `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `rating_avg` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `rating_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tours_slug_key`(`slug`),
    UNIQUE INDEX `tours_code_key`(`code`),
    INDEX `tours_status_is_featured_sort_order_idx`(`status`, `is_featured`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tour_itinerary_days` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tour_id` INTEGER NOT NULL,
    `day_number` SMALLINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `meals` JSON NULL,
    `hotel` VARCHAR(200) NULL,

    UNIQUE INDEX `tour_itinerary_days_tour_id_day_number_key`(`tour_id`, `day_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tour_itinerary_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day_id` INTEGER NOT NULL,
    `slot` ENUM('morning', 'afternoon', 'evening') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `tour_itinerary_items_day_id_slot_sort_order_idx`(`day_id`, `slot`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `destinations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `province` VARCHAR(120) NOT NULL,
    `category` VARCHAR(40) NULL,
    `short_desc` VARCHAR(500) NULL,
    `description` MEDIUMTEXT NULL,
    `best_season` VARCHAR(200) NULL,
    `lat` DECIMAL(10, 7) NULL,
    `lng` DECIMAL(10, 7) NULL,
    `map_embed_url` VARCHAR(1000) NULL,
    `travel_note` VARCHAR(500) NULL,
    `cover_image_url` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `destinations_slug_key`(`slug`),
    INDEX `destinations_province_status_idx`(`province`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journey_legs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sort_order` INTEGER NOT NULL,
    `from_place` VARCHAR(120) NOT NULL,
    `to_place` VARCHAR(120) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `duration_text` VARCHAR(100) NULL,
    `distance_km` SMALLINT UNSIGNED NULL,
    `food_note` VARCHAR(500) NULL,
    `image_url` VARCHAR(500) NULL,

    INDEX `journey_legs_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tour_destinations` (
    `tour_id` INTEGER NOT NULL,
    `destination_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`tour_id`, `destination_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuisines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `where_to_eat` VARCHAR(500) NULL,
    `province` VARCHAR(120) NULL,
    `image_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `cuisines_slug_key`(`slug`),
    INDEX `cuisines_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tour_cuisines` (
    `tour_id` INTEGER NOT NULL,
    `cuisine_id` INTEGER NOT NULL,

    PRIMARY KEY (`tour_id`, `cuisine_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(200) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `content` MEDIUMTEXT NULL,
    `cover_image_url` VARCHAR(500) NULL,
    `category` VARCHAR(60) NULL,
    `tags` JSON NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `published_at` DATETIME(3) NULL,
    `author_id` INTEGER NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `seo_title` VARCHAR(200) NULL,
    `seo_description` VARCHAR(320) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_status_published_at_idx`(`status`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(40) NOT NULL DEFAULT 'general',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `faqs_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('image', 'youtube') NOT NULL DEFAULT 'image',
    `url` VARCHAR(1000) NOT NULL,
    `thumbnail_url` VARCHAR(1000) NULL,
    `title` VARCHAR(255) NULL,
    `alt` VARCHAR(255) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `tags` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `media_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tour_departures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tour_id` INTEGER NOT NULL,
    `departure_date` DATE NOT NULL,
    `return_date` DATE NULL,
    `capacity_total` SMALLINT UNSIGNED NOT NULL,
    `seats_taken` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `price_adult` INTEGER NULL,
    `price_child` INTEGER NULL,
    `holiday_surcharge` INTEGER NOT NULL DEFAULT 0,
    `meeting_point` VARCHAR(255) NULL,
    `status` ENUM('open', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tour_departures_departure_date_status_idx`(`departure_date`, `status`),
    UNIQUE INDEX `tour_departures_tour_id_departure_date_key`(`tour_id`, `departure_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(24) NOT NULL,
    `tour_id` INTEGER NOT NULL,
    `departure_id` INTEGER NOT NULL,
    `contact_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(160) NULL,
    `pickup_point` VARCHAR(255) NULL,
    `adults` SMALLINT UNSIGNED NOT NULL,
    `children` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `unit_price_adult` INTEGER NOT NULL,
    `unit_price_child` INTEGER NOT NULL DEFAULT 0,
    `surcharge` INTEGER NOT NULL DEFAULT 0,
    `total_amount` INTEGER NOT NULL,
    `status` ENUM('new', 'pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
    `source` ENUM('web', 'zalo', 'phone', 'facebook') NOT NULL DEFAULT 'web',
    `customer_note` TEXT NULL,
    `admin_note` TEXT NULL,
    `cancel_reason` VARCHAR(500) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `cancelled_by` INTEGER NULL,
    `lookup_token` CHAR(24) NOT NULL,
    `confirmed_at` DATETIME(3) NULL,
    `confirmed_by` INTEGER NULL,
    `ip_hash` CHAR(64) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_code_key`(`code`),
    UNIQUE INDEX `orders_lookup_token_key`(`lookup_token`),
    INDEX `orders_phone_idx`(`phone`),
    INDEX `orders_status_created_at_idx`(`status`, `created_at`),
    INDEX `orders_departure_id_status_idx`(`departure_id`, `status`),
    INDEX `orders_tour_id_created_at_idx`(`tour_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_passengers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `full_name` VARCHAR(120) NULL,
    `type` ENUM('adult', 'child') NOT NULL,
    `birth_year` SMALLINT UNSIGNED NULL,
    `note` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `order_passengers_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `from_status` ENUM('new', 'pending', 'confirmed', 'completed', 'cancelled') NULL,
    `to_status` ENUM('new', 'pending', 'confirmed', 'completed', 'cancelled') NOT NULL,
    `note` VARCHAR(500) NULL,
    `changed_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_status_history_order_id_created_at_idx`(`order_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_sequences` (
    `year` INTEGER NOT NULL,
    `last_seq` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tour_id` INTEGER NULL,
    `order_id` INTEGER NULL,
    `author_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `rating` TINYINT UNSIGNED NOT NULL,
    `comment` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'hidden') NOT NULL DEFAULT 'pending',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `admin_reply` TEXT NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_order_id_key`(`order_id`),
    INDEX `reviews_tour_id_status_created_at_idx`(`tour_id`, `status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `review_id` INTEGER NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `review_images_review_id_idx`(`review_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(160) NULL,
    `subject` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('new', 'read', 'replied', 'spam') NOT NULL DEFAULT 'new',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_messages_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(160) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `role` ENUM('owner', 'admin', 'editor') NOT NULL DEFAULT 'admin',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `action` VARCHAR(60) NOT NULL,
    `entity` VARCHAR(40) NOT NULL,
    `entity_id` INTEGER NULL,
    `meta` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_audit_logs_entity_entity_id_created_at_idx`(`entity`, `entity_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tour_itinerary_days` ADD CONSTRAINT `tour_itinerary_days_tour_id_fkey` FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tour_itinerary_items` ADD CONSTRAINT `tour_itinerary_items_day_id_fkey` FOREIGN KEY (`day_id`) REFERENCES `tour_itinerary_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tour_destinations` ADD CONSTRAINT `tour_destinations_tour_id_fkey` FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tour_destinations` ADD CONSTRAINT `tour_destinations_destination_id_fkey` FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tour_cuisines` ADD CONSTRAINT `tour_cuisines_tour_id_fkey` FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tour_cuisines` ADD CONSTRAINT `tour_cuisines_cuisine_id_fkey` FOREIGN KEY (`cuisine_id`) REFERENCES `cuisines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tour_departures` ADD CONSTRAINT `tour_departures_tour_id_fkey` FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_tour_id_fkey` FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_departure_id_fkey` FOREIGN KEY (`departure_id`) REFERENCES `tour_departures`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_passengers` ADD CONSTRAINT `order_passengers_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_tour_id_fkey` FOREIGN KEY (`tour_id`) REFERENCES `tours`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_images` ADD CONSTRAINT `review_images_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_logs` ADD CONSTRAINT `admin_audit_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
