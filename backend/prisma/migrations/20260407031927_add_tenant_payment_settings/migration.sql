-- AlterTable
ALTER TABLE `BusinessSettings` ADD COLUMN `mercadoPagoAccessToken` TEXT NULL,
    ADD COLUMN `mercadoPagoEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mercadoPagoPublicKey` VARCHAR(191) NULL,
    ADD COLUMN `mercadoPagoWebhookSecret` TEXT NULL;
