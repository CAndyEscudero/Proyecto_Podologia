-- AlterTable
ALTER TABLE `BusinessSettings` ADD COLUMN `transactionalEmailEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `transactionalEmailFromName` VARCHAR(191) NULL,
    ADD COLUMN `transactionalEmailReplyTo` VARCHAR(191) NULL;
