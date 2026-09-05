import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Poblando datos iniciales en Supabase...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Crear Usuario Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@guardianocturna.com' },
    update: {},
    create: {
      email: 'admin@guardianocturna.com',
      password: hashedPassword,
      fullName: 'SuperAdmin Guardia Nocturna',
      phone: '5491133231465',
      role: 'ADMIN',
      status: 'APPROVED',
      commissionRate: 0.10,
      applyCommission: true,
    },
  });
  console.log('✅ Usuario Admin creado:', admin.email);

  // 2. Crear Usuario Docente Principal
  const teacherPass = await bcrypt.hash('profemauro123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'profemauro@guardianocturna.com' },
    update: {},
    create: {
      email: 'profemauro@guardianocturna.com',
      password: teacherPass,
      fullName: 'Prof. Mauro Díaz',
      phone: '5491133231465',
      role: 'TEACHER',
      status: 'APPROVED',
      commissionRate: 0.10,
      applyCommission: true,
    },
  });
  console.log('✅ Usuario Docente creado:', teacher.email);

  // 3. Crear Disponibilidad del Docente Principal
  const availability = await prisma.availability.upsert({
    where: { teacherId: teacher.id },
    update: {},
    create: {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      teacherPhone: teacher.phone || '5491133231465',
      aliasMP: 'guardia.nocturna.mp',
      linkMP: '',
      is24Hours: false,
      startHour: 8,
      endHour: 23,
      availableDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      subjects: JSON.stringify([
        'Matemática / Álgebra',
        'Física I y II',
        'Programación & Algoritmos',
        'Química',
        'Inglés Técnico',
      ]),
      hourlyRate: 5000,
    },
  });
  console.log('✅ Disponibilidad de materias y grilla cargada:', availability.teacherName);

  console.log('🎉 Poblamiento completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error poblando Supabase:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
