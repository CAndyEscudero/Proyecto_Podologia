-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `depositCents` INTEGER NULL,
    ADD COLUMN `paymentApprovedAt` DATETIME(3) NULL,
    ADD COLUMN `paymentExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `paymentOption` ENUM('DEPOSIT', 'FULL') NOT NULL DEFAULT 'DEPOSIT',
    ADD COLUMN `paymentPreferenceId` VARCHAR(191) NULL,
    ADD COLUMN `paymentProvider` VARCHAR(191) NULL,
    ADD COLUMN `paymentReference` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `priceCents` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Appointment_paymentReference_key` ON `Appointment`(`paymentReference`);

-- CreateIndex
CREATE UNIQUE INDEX `Appointment_paymentPreferenceId_key` ON `Appointment`(`paymentPreferenceId`);

-- CreateIndex
CREATE INDEX `Appointment_paymentStatus_paymentExpiresAt_idx` ON `Appointment`(`paymentStatus`, `paymentExpiresAt`);
