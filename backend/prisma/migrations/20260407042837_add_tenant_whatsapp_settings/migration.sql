-- AlterTable
ALTER TABLE `BusinessSettings` ADD COLUMN `whatsAppDefaultMessage` TEXT NULL,
    ADD COLUMN `whatsAppEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `whatsAppNumber` VARCHAR(191) NULL;
