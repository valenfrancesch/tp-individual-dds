import app from './app.js';
import { seedDatabase } from './seed/seedData.js';

const PORT = process.env.PORT || 3001;

const seedInfo = await seedDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Ticket It API en http://localhost:${PORT}`);
  console.log('Usuarios seed (passwords en texto solo en consola/docs):');
  seedInfo.usuarios.forEach((u) => {
    console.log(`  ${u.email} / ${u.password}  roles=[${u.roles.join(', ')}]`);
  });
});
