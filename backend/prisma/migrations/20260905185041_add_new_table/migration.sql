-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "academicLevel" TEXT,
ADD COLUMN     "platformFee" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "pricingType" TEXT NOT NULL DEFAULT 'PER_HOUR',
ADD COLUMN     "specificTopics" TEXT,
ADD COLUMN     "studyMaterialUrl" TEXT,
ADD COLUMN     "teacherNet" INTEGER NOT NULL DEFAULT 4500,
ADD COLUMN     "totalAmount" INTEGER NOT NULL DEFAULT 5000;

-- AlterTable
ALTER TABLE "availability" ADD COLUMN     "linkMP" TEXT NOT NULL DEFAULT 'https://mpago.la/guardianocturna',
ADD COLUMN     "pricingType" TEXT NOT NULL DEFAULT 'PER_HOUR',
ADD COLUMN     "subjectRates" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "applyCommission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "mpPreferenceId" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'MERCADO_PAGO',
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "totalAmount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "teacherNet" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_payouts" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_appointmentId_key" ON "payment_transactions"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_mpPaymentId_key" ON "payment_transactions"("mpPaymentId");
