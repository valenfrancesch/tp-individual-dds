/**
 * Smoke E2E: login → compra multi-item → chat → cancelar → utilizar → reseña
 */
const API = process.env.API_URL || 'http://localhost:3001';

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${data.error || res.status}`);
  return data;
}

async function main() {
  const ana = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'ana@ticket.it', password: 'ana123' },
  });
  const luis = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'luis@ticket.it', password: 'luis123' },
  });

  const eventos = await req('/api/eventos?orden=fecha&dir=asc', {
    token: ana.token,
  });
  const evento = eventos.find((e) => e.organizadorId === luis.user.id);
  const t1 = evento.tiposEntrada[0];
  const t2 = evento.tiposEntrada[1];

  const compra = await req('/api/compras', {
    method: 'POST',
    token: ana.token,
    body: {
      eventoId: evento.id,
      items: [
        { tipoEntradaId: t1.id, cantidad: 1 },
        { tipoEntradaId: t2.id, cantidad: 1 },
      ],
    },
  });
  const pagada = await req(`/api/compras/${compra.id}/pagar`, {
    method: 'POST',
    token: ana.token,
  });
  console.log('OK compra multi-item', pagada.id, pagada.estado, pagada.total);

  const chat = await req(`/api/compras/${pagada.id}/mensajes`, {
    token: ana.token,
  });
  if (!chat.evento?.nombre) throw new Error('Chat sin header de evento');
  await req(`/api/compras/${pagada.id}/mensajes`, {
    method: 'POST',
    token: ana.token,
    body: { mensaje: 'Consulta smoke' },
  });
  console.log('OK chat header + mensaje');

  const mias = await req('/api/compras/mias', { token: ana.token });
  const confirmada = mias.find(
    (c) => c.estado === 'CONFIRMADA' && c.id !== pagada.id,
  );
  if (confirmada) {
    await req(`/api/compras/${confirmada.id}/utilizar`, {
      method: 'POST',
      token: luis.token,
    });
    await req(`/api/compras/${confirmada.id}/resenia`, {
      method: 'POST',
      token: ana.token,
      body: { detalle: 'Smoke review', puntuacion: 5 },
    });
    console.log('OK utilizar + reseña', confirmada.id);
  }

  const cancelada = await req(`/api/compras/${pagada.id}/cancelar`, {
    method: 'POST',
    token: ana.token,
  });
  console.log('OK cancelar', cancelada.estado);

  const stats = await req(`/api/eventos/${evento.id}/compras`, {
    token: luis.token,
  });
  if (!stats.estadisticas?.porTipo) throw new Error('Faltan estadisticas');
  console.log('OK stats organizador');

  console.log('SMOKE OK');
}

main().catch((err) => {
  console.error('SMOKE FAIL', err.message);
  process.exit(1);
});
