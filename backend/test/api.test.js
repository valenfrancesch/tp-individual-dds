import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { seedDatabase } from '../src/seed/seedData.js';

let server;
let base;

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function login(email, password) {
  const { data } = await req('/api/sesiones', { method: 'POST', body: { email, password } });
  return data.token;
}

before(async () => {
  await seedDatabase();
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('auth: credenciales inválidas y token requerido', async () => {
  const bad = await req('/api/sesiones', { method: 'POST', body: { email: 'ana@ticket.it', password: 'x' } });
  assert.equal(bad.status, 401);
  const sinToken = await req('/api/eventos');
  assert.equal(sinToken.status, 401);
});

test('flujo completo: comprar → pagar → chat → cancelar → reembolsar', async () => {
  const ana = await login('ana@ticket.it', 'ana123');
  const luis = await login('luis@ticket.it', 'luis123');

  const { data: eventos } = await req('/api/eventos?q=rock', { token: ana });
  const rock = eventos[0];
  const vip = rock.tiposEntrada.find((t) => t.nombre === 'VIP');

  const creada = await req('/api/compras', {
    method: 'POST',
    token: ana,
    body: { eventoId: rock.id, tipoEntradaId: vip.id, cantidad: 2 },
  });
  assert.equal(creada.status, 201);
  assert.equal(creada.data.estado, 'PENDIENTE');
  assert.equal(creada.data.total, vip.precio * 2);
  assert.deepEqual(creada.data.acciones, ['pagar', 'cancelar']);

  const id = creada.data.id;
  const estadoInvalido = await req(`/api/compras/${id}/cambios-estado`, { method: 'POST', token: ana, body: { estado: 'PENDIENTE' } });
  assert.equal(estadoInvalido.status, 400);
  const pagada = await req(`/api/compras/${id}/cambios-estado`, { method: 'POST', token: ana, body: { estado: 'CONFIRMADA' } });
  assert.equal(pagada.data.estado, 'CONFIRMADA');
  const repago = await req(`/api/compras/${id}/cambios-estado`, { method: 'POST', token: ana, body: { estado: 'CONFIRMADA' } });
  assert.equal(repago.status, 400);

  await req(`/api/compras/${id}/mensajes`, { method: 'POST', token: ana, body: { mensaje: 'Hola' } });
  await req(`/api/compras/${id}/mensajes`, { method: 'POST', token: luis, body: { mensaje: 'Hola Ana' } });
  const chat = await req(`/api/compras/${id}/mensajes`, { token: luis });
  assert.equal(chat.data.mensajes.length, 2);

  const cancelada = await req(`/api/compras/${id}/cambios-estado`, { method: 'POST', token: ana, body: { estado: 'CANCELADA' } });
  assert.equal(cancelada.data.estado, 'CANCELADA');
  const reembolsoComprador = await req(`/api/compras/${id}/cambios-estado`, { method: 'POST', token: ana, body: { estado: 'REEMBOLSADA' } });
  assert.equal(reembolsoComprador.status, 403);
  const reembolsada = await req(`/api/compras/${id}/cambios-estado`, { method: 'POST', token: luis, body: { estado: 'REEMBOLSADA' } });
  assert.equal(reembolsada.data.estado, 'REEMBOLSADA');
  assert.deepEqual(
    reembolsada.data.historial.map((h) => h.estado),
    ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'REEMBOLSADA'],
  );

  const stats = await req(`/api/eventos/${rock.id}/compras?estado=REEMBOLSADA`, { token: luis });
  assert.equal(stats.data.compras.length, 1);
  const vipStats = stats.data.estadisticas.porTipo.find((t) => t.nombre === 'VIP');
  assert.equal(vipStats.disponibles, vip.cupo, 'el cupo vuelve tras cancelar');
});

test('no se puede superar el cupo', async () => {
  const ana = await login('ana@ticket.it', 'ana123');
  const { data: eventos } = await req('/api/eventos?q=jazz', { token: ana });
  const jazz = eventos[0];
  const t = jazz.tiposEntrada[0];
  const res = await req('/api/compras', {
    method: 'POST',
    token: ana,
    body: { eventoId: jazz.id, tipoEntradaId: t.id, cantidad: t.cupo + 1 },
  });
  assert.equal(res.status, 400);
  assert.match(res.data.error, /cupo/);
});

test('reseña de una compra utilizada aparece en el organizador', async () => {
  const ana = await login('ana@ticket.it', 'ana123');
  const luis = await login('luis@ticket.it', 'luis123');
  const { data: mias } = await req('/api/usuarios/me/compras', { token: ana });
  const paraReseniar = mias.find((c) => c.acciones.includes('reseniar'));
  assert.ok(paraReseniar, 'el seed deja una compra lista para reseñar');

  const res = await req(`/api/compras/${paraReseniar.id}/resenia`, {
    method: 'POST',
    token: ana,
    body: { puntuacion: 3, detalle: 'Bien' },
  });
  assert.equal(res.status, 201);
  const { data: recibidas } = await req('/api/organizadores/me/resenias', { token: luis });
  assert.ok(recibidas.some((r) => r.id === res.data.id));
});

test('favoritos, filtro de precio y orden', async () => {
  const ana = await login('ana@ticket.it', 'ana123');
  const { data: evs } = await req('/api/eventos?q=hamlet', { token: ana });
  const hamlet = evs[0];

  await req(`/api/usuarios/me/favoritos/${hamlet.id}`, { method: 'POST', token: ana });
  await req(`/api/usuarios/me/favoritos/${hamlet.id}`, { method: 'POST', token: ana });
  let favs = (await req('/api/eventos?soloFavoritos=true', { token: ana })).data;
  assert.equal(favs.filter((e) => e.id === hamlet.id).length, 1);

  await req(`/api/usuarios/me/favoritos/${hamlet.id}`, { method: 'DELETE', token: ana });
  await req(`/api/usuarios/me/favoritos/${hamlet.id}`, { method: 'DELETE', token: ana });
  favs = (await req('/api/usuarios/me/favoritos', { token: ana })).data;
  assert.ok(!favs.some((e) => e.id === hamlet.id), 'DELETE nunca agrega');

  const rango = (await req('/api/eventos?precioMin=16000&precioMax=20000', { token: ana })).data;
  assert.ok(rango.every((e) => e.tiposEntrada.some((t) => t.precio >= 16000 && t.precio <= 20000)));
  const invalido = await req('/api/eventos?precioMin=10&precioMax=5', { token: ana });
  assert.equal(invalido.status, 400);

  const porPrecio = (await req('/api/eventos?orden=precio&dir=asc', { token: ana })).data;
  const precios = porPrecio.map((e) => e.precioDesde);
  assert.deepEqual(precios, [...precios].sort((a, b) => a - b));
});

test('crear evento valida datos y rol', async () => {
  const ana = await login('ana@ticket.it', 'ana123');
  const luis = await login('luis@ticket.it', 'luis123');
  const { data: cats } = await req('/api/categorias', { token: luis });
  const valido = {
    nombre: 'Nuevo',
    categoriaId: cats[0].id,
    fecha: new Date(Date.now() + 5 * 86400000).toISOString(),
    tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }],
    multimedia: ['https://picsum.photos/seed/x/800/400'],
  };
  assert.equal((await req('/api/eventos', { method: 'POST', token: ana, body: valido })).status, 403);
  const pasado = await req('/api/eventos', {
    method: 'POST',
    token: luis,
    body: { ...valido, fecha: '2020-01-01T00:00:00Z' },
  });
  assert.equal(pasado.status, 400);
  const precioCero = await req('/api/eventos', {
    method: 'POST',
    token: luis,
    body: { ...valido, tiposEntrada: [{ nombre: 'G', precio: 0, cupo: 1 }] },
  });
  assert.equal(precioCero.status, 400);
  const ok = await req('/api/eventos', { method: 'POST', token: luis, body: valido });
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.data.multimedia, valido.multimedia);
});
