import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import eventoRoutes from './routes/eventoRoutes.js';
import compraRoutes from './routes/compraRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'AI Ticket It API' });
});

app.use('/api/auth', authRoutes);
app.use('/api', eventoRoutes);
app.use('/api', compraRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

export default app;
