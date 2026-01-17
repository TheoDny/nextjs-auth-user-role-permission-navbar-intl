/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `token_create_account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "account_providerId_accountId_idx" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "entity_deletedAt_idx" ON "entity"("deletedAt");

-- CreateIndex
CREATE INDEX "entity_name_idx" ON "entity"("name");

-- CreateIndex
CREATE INDEX "log_userId_idx" ON "log"("userId");

-- CreateIndex
CREATE INDEX "log_entityId_idx" ON "log"("entityId");

-- CreateIndex
CREATE INDEX "log_actionDate_idx" ON "log"("actionDate");

-- CreateIndex
CREATE INDEX "log_actionType_idx" ON "log"("actionType");

-- CreateIndex
CREATE INDEX "log_entityId_actionDate_idx" ON "log"("entityId", "actionDate");

-- CreateIndex
CREATE INDEX "role_deletedAt_idx" ON "role"("deletedAt");

-- CreateIndex
CREATE INDEX "role_name_idx" ON "role"("name");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "session_token_idx" ON "session"("token");

-- CreateIndex
CREATE INDEX "token_create_account_email_idx" ON "token_create_account"("email");

-- CreateIndex
CREATE INDEX "token_create_account_token_email_idx" ON "token_create_account"("token", "email");

-- CreateIndex
CREATE INDEX "token_create_account_expiresAt_idx" ON "token_create_account"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "token_create_account_token_key" ON "token_create_account"("token");

-- CreateIndex
CREATE INDEX "user_deletedAt_idx" ON "user"("deletedAt");

-- CreateIndex
CREATE INDEX "user_active_idx" ON "user"("active");

-- CreateIndex
CREATE INDEX "user_email_deletedAt_idx" ON "user"("email", "deletedAt");

-- CreateIndex
CREATE INDEX "verification_identifier_value_idx" ON "verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");
