-- CreateTable
CREATE TABLE `MercadoPagoConnection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `status` ENUM('DISCONNECTED', 'PENDING', 'CONNECTED', 'ERROR') NOT NULL DEFAULT 'DISCONNECTED',
    `mercadoPagoUserId` VARCHAR(191) NULL,
    `collectorId` VARCHAR(191) NULL,
    `publicKey` VARCHAR(191) NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `tokenType` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `liveMode` BOOLEAN NOT NULL DEFAULT false,
    `connectedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `lastRefreshedAt` DATETIME(3) NULL,
    `lastWebhookAt` DATETIME(3) NULL,
    `lastWebhookStatus` VARCHAR(191) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MercadoPagoConnection_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MercadoPagoConnection` ADD CONSTRAINT `MercadoPagoConnection_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
