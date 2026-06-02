/*
  Warnings:

  - You are about to drop the column `userId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `mobile` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetOtpExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetOtpHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropIndex
DROP INDEX "Conversation_userId_idx";

-- DropIndex
DROP INDEX "User_mobile_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationExpires",
DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerified",
DROP COLUMN "mobile",
DROP COLUMN "resetOtpExpires",
DROP COLUMN "resetOtpHash",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpires";

-- DropTable
DROP TABLE "RefreshToken";
