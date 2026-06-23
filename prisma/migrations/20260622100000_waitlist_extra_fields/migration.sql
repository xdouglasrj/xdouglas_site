-- AlterEnum
ALTER TYPE "WaitlistTipoUsuario" ADD VALUE 'MUSICO';
ALTER TYPE "WaitlistTipoUsuario" ADD VALUE 'OUVINTE';

-- AlterTable
ALTER TABLE "waitlist" ADD COLUMN "artistic_name" TEXT,
ADD COLUMN "phone" TEXT;
