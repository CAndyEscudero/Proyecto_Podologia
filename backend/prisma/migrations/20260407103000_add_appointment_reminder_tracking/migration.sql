ALTER TABLE `Appointment`
  ADD COLUMN `reminderDueAt` DATETIME(3) NULL,
  ADD COLUMN `reminderSentAt` DATETIME(3) NULL,
  ADD COLUMN `reminderProcessedAt` DATETIME(3) NULL,
  ADD COLUMN `reminderLastAttemptAt` DATETIME(3) NULL,
  ADD COLUMN `reminderSendAttempts` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `reminderLastError` TEXT NULL;

UPDATE `Appointment`
SET `reminderDueAt` = DATE_SUB(TIMESTAMP(`date`, `startTime`), INTERVAL 24 HOUR)
WHERE `status` = 'CONFIRMED'
  AND `reminderDueAt` IS NULL
  AND TIMESTAMP(`date`, `startTime`) > NOW();

CREATE INDEX `appt_reminder_idx`
  ON `Appointment`(`tenantId`, `status`, `reminderProcessedAt`, `reminderDueAt`);
