import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import eventoRoutes from './routes/eventoRoutes.js';
import compraRoutes from './routes/compraRoutes.js';
import { AppError } from './errors/AppError.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'AI Ticket It API' });
});

app.use('/api', authRoutes);
app.use('/api', compraRoutes);
app.use('/api', eventoRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware único de errores: Express 5 captura tanto throws como promesas rechazadas.
app.use((err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno' });
});

export default app;
