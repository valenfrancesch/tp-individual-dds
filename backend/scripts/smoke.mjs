/**
 * Smoke E2E contra un backend levantado (npm start):
 * login → comprar → pagar → chat → cancelar → reembolsar → utilizar → reseñar
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

const login = (email, password) =>
  req('/api/auth/login', { method: 'POST', body: { email, password } }).then((r) => r.token);

async function main() {
  const ana = await login('ana@ticket.it', 'ana123');
  const luis = await login('luis@ticket.it', 'luis123');

  const [rock] = await req('/api/eventos?q=rock', { token: ana });
  const tipo = rock.tiposEntrada[0];

  const compra = await req('/api/compras', {
    method: 'POST',
    token: ana,
    body: { eventoId: rock.id, tipoEntradaId: tipo.id, cantidad: 1 },
  });
  await req(`/api/compras/${compra.id}/pagar`, { method: 'POST', token: ana });
  console.log('OK compra + pago', compra.id);

  await req(`/api/compras/${compra.id}/mensajes`, { method: 'POST', token: ana, body: { mensaje: 'Consulta smoke' } });
  await req(`/api/compras/${compra.id}/mensajes`, { method: 'POST', token: luis, body: { mensaje: 'Respuesta smoke' } });
  console.log('OK chat');

  await req(`/api/compras/${compra.id}/cancelar`, { method: 'POST', token: ana });
  const reembolsada = await req(`/api/compras/${compra.id}/reembolsar`, { method: 'POST', token: luis });
  console.log('OK cancelar + reembolsar', reembolsada.estado);

  const { compras } = await req(`/api/eventos/${(await req('/api/eventos?q=jazz', { token: luis }))[0].id}/compras`, { token: luis });
  const paraUsar = compras.find((c) => c.acciones.includes('utilizar'));
  if (paraUsar) {
    await req(`/api/compras/${paraUsar.id}/utilizar`, { method: 'POST', token: luis });
    console.log('OK utilizar', paraUsar.id);
  }

  const mias = await req('/api/compras/mias', { token: ana });
  const paraReseniar = mias.find((c) => c.acciones.includes('reseniar'));
  if (paraReseniar) {
    await req(`/api/compras/${paraReseniar.id}/resenia`, {
      method: 'POST',
      token: ana,
      body: { puntuacion: 5, detalle: 'Smoke review' },
    });
    console.log('OK reseña', paraReseniar.id);
  }

  console.log('SMOKE OK');
}

main().catch((err) => {
  console.error('SMOKE FAIL', err.message);
  process.exit(1);
});
