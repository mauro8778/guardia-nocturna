-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT_UNPAID',
    "meetingUrl" TEXT,
    "receiptRef" TEXT,
    "receiptUrl" TEXT,
    "teacherId" TEXT NOT NULL DEFAULT 'default-teacher-id',
    "teacherName" TEXT NOT NULL DEFAULT 'Prof. Mauro Díaz',
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL DEFAULT 'default-teacher-id',
    "teacherName" TEXT NOT NULL DEFAULT 'Prof. Mauro Díaz',
    "teacherPhone" TEXT NOT NULL DEFAULT '5491133231465',
    "aliasMP" TEXT NOT NULL DEFAULT 'guardia.nocturna.mp',
    "is24Hours" BOOLEAN NOT NULL DEFAULT false,
    "startHour" INTEGER NOT NULL DEFAULT 8,
    "endHour" INTEGER NOT NULL DEFAULT 22,
    "availableDays" TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
    "subjects" TEXT NOT NULL DEFAULT '["Matemática / Álgebra", "Física I y II", "Programación & Algoritmos", "Química", "Inglés Técnico"]',
    "hourlyRate" INTEGER NOT NULL DEFAULT 5000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "availability_teacherId_key" ON "availability"("teacherId");
