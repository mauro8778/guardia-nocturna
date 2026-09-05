import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando datos de prueba y mocks de Supabase...');

  await prisma.paymentTransaction.deleteMany();
  await prisma.teacherPayout.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Base de datos en Supabase limpiada 100%. Sin docentes de prueba ni fakes.');
}

main()
  .catch((e) => {
    console.error('❌ Error limpiando Supabase:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
