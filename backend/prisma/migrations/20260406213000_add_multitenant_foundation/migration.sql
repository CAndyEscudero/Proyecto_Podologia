-- CreateTable
CREATE TABLE `Tenant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `businessType` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantDomain` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `hostname` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('PLATFORM_SUBDOMAIN', 'CUSTOM_SUBDOMAIN', 'CUSTOM_ROOT') NOT NULL DEFAULT 'PLATFORM_SUBDOMAIN',
    `status` ENUM('PENDING', 'ACTIVE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TenantDomain_hostname_key`(`hostname`),
    INDEX `TenantDomain_tenantId_idx`(`tenantId`),
    INDEX `TenantDomain_tenantId_isPrimary_idx`(`tenantId`, `isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed a default tenant to adopt the current single-business data
INSERT INTO `Tenant` (`name`, `slug`, `businessType`, `status`, `createdAt`, `updatedAt`)
VALUES ('Pies Sanos Venado', 'pies-sanos-venado', 'PODOLOGY', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

SET @defaultTenantId := (SELECT `id` FROM `Tenant` WHERE `slug` = 'pies-sanos-venado' LIMIT 1);

INSERT INTO `TenantDomain` (`tenantId`, `hostname`, `isPrimary`, `type`, `status`, `verifiedAt`, `createdAt`, `updatedAt`)
VALUES (@defaultTenantId, 'pies-sanos-venado.localhost', true, 'PLATFORM_SUBDOMAIN', 'ACTIVE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Drop old foreign keys on Appointment so we can recreate them with tenant-scoped relations
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_clientId_fkey`;
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_serviceId_fkey`;

-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `tenantId` INTEGER NULL;

ALTER TABLE `Client`
    ADD COLUMN `tenantId` INTEGER NULL,
    DROP INDEX `Client_email_key`;

ALTER TABLE `Service`
    ADD COLUMN `tenantId` INTEGER NULL,
    DROP INDEX `Service_slug_key`;

ALTER TABLE `Appointment`
    ADD COLUMN `tenantId` INTEGER NULL,
    DROP INDEX `Appointment_date_startTime_idx`,
    DROP INDEX `Appointment_paymentReference_key`,
    DROP INDEX `Appointment_paymentPreferenceId_key`,
    DROP INDEX `Appointment_paymentStatus_paymentExpiresAt_idx`;

ALTER TABLE `AvailabilityRule`
    ADD COLUMN `tenantId` INTEGER NULL;

ALTER TABLE `BlockedDate`
    ADD COLUMN `tenantId` INTEGER NULL;

ALTER TABLE `BusinessSettings`
    ADD COLUMN `tenantId` INTEGER NULL,
    ADD COLUMN `depositPercentage` INTEGER NOT NULL DEFAULT 50;

-- Backfill tenantId in the existing single-business rows
UPDATE `User` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;
UPDATE `Client` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;
UPDATE `Service` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;
UPDATE `Appointment` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;
UPDATE `AvailabilityRule` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;
UPDATE `BlockedDate` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;
UPDATE `BusinessSettings` SET `tenantId` = @defaultTenantId WHERE `tenantId` IS NULL;

-- Make tenantId required everywhere after backfill
ALTER TABLE `User`
    MODIFY `tenantId` INTEGER NOT NULL;

ALTER TABLE `Client`
    MODIFY `tenantId` INTEGER NOT NULL;

ALTER TABLE `Service`
    MODIFY `tenantId` INTEGER NOT NULL;

ALTER TABLE `Appointment`
    MODIFY `tenantId` INTEGER NOT NULL;

ALTER TABLE `AvailabilityRule`
    MODIFY `tenantId` INTEGER NOT NULL;

ALTER TABLE `BlockedDate`
    MODIFY `tenantId` INTEGER NOT NULL;

ALTER TABLE `BusinessSettings`
    MODIFY `tenantId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `User_tenantId_idx` ON `User`(`tenantId`);
CREATE INDEX `User_tenantId_role_idx` ON `User`(`tenantId`, `role`);

CREATE UNIQUE INDEX `Client_tenantId_email_key` ON `Client`(`tenantId`, `email`);
CREATE UNIQUE INDEX `Client_id_tenantId_key` ON `Client`(`id`, `tenantId`);
CREATE INDEX `Client_tenantId_phone_idx` ON `Client`(`tenantId`, `phone`);

CREATE UNIQUE INDEX `Service_tenantId_slug_key` ON `Service`(`tenantId`, `slug`);
CREATE UNIQUE INDEX `Service_id_tenantId_key` ON `Service`(`id`, `tenantId`);
CREATE INDEX `Service_tenantId_isActive_idx` ON `Service`(`tenantId`, `isActive`);

CREATE UNIQUE INDEX `Appointment_tenantId_paymentReference_key` ON `Appointment`(`tenantId`, `paymentReference`);
CREATE UNIQUE INDEX `Appointment_tenantId_paymentPreferenceId_key` ON `Appointment`(`tenantId`, `paymentPreferenceId`);
CREATE INDEX `Appointment_tenantId_date_startTime_idx` ON `Appointment`(`tenantId`, `date`, `startTime`);
CREATE INDEX `Appointment_tenantId_paymentStatus_paymentExpiresAt_idx` ON `Appointment`(`tenantId`, `paymentStatus`, `paymentExpiresAt`);
CREATE INDEX `Appointment_tenantId_clientId_idx` ON `Appointment`(`tenantId`, `clientId`);
CREATE INDEX `Appointment_tenantId_serviceId_idx` ON `Appointment`(`tenantId`, `serviceId`);

CREATE INDEX `AvailabilityRule_tenantId_dayOfWeek_isActive_idx` ON `AvailabilityRule`(`tenantId`, `dayOfWeek`, `isActive`);
CREATE INDEX `BlockedDate_tenantId_date_idx` ON `BlockedDate`(`tenantId`, `date`);
CREATE UNIQUE INDEX `BusinessSettings_tenantId_key` ON `BusinessSettings`(`tenantId`);

-- AddForeignKey
ALTER TABLE `TenantDomain` ADD CONSTRAINT `TenantDomain_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `User` ADD CONSTRAINT `User_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Client` ADD CONSTRAINT `Client_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Service` ADD CONSTRAINT `Service_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AvailabilityRule` ADD CONSTRAINT `AvailabilityRule_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `BlockedDate` ADD CONSTRAINT `BlockedDate_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `BusinessSettings` ADD CONSTRAINT `BusinessSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_clientId_tenantId_fkey`
    FOREIGN KEY (`clientId`, `tenantId`) REFERENCES `Client`(`id`, `tenantId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_serviceId_tenantId_fkey`
    FOREIGN KEY (`serviceId`, `tenantId`) REFERENCES `Service`(`id`, `tenantId`) ON DELETE RESTRICT ON UPDATE CASCADE;
