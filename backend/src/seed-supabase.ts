import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🛡️ Creando únicamente la cuenta de SuperAdmin en Supabase...');

  const hashedPassword = await bcrypt.hash('simona8778', 10);

  // Crear o actualizar únicamente el usuario SuperAdmin
  const admin = await prisma.user.upsert({
    where: { email: 'maurodiaz8778@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      status: 'APPROVED',
    },
    create: {
      email: 'maurodiaz8778@gmail.com',
      password: hashedPassword,
      fullName: 'Mauro Díaz (Admin)',
      phone: '5491133231465',
      role: 'ADMIN',
      status: 'APPROVED',
      commissionRate: 0.10,
      applyCommission: true,
    },
  });

  console.log('✅ Usuario SuperAdmin creado exitosamente:', admin.email);
  console.log('🔒 La cuenta es ADMIN puro: NO posee registro de disponibilidad y NUNCA aparecerá en la grilla pública de profesores.');
}

main()
  .catch((e) => {
    console.error('❌ Error creando SuperAdmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
