import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Usuario } from '../../src/domain/Usuario.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { Evento } from '../../src/domain/Evento.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Compra, AccionCompra } from '../../src/domain/Compra.js';
import { EstadoCompra, puedeTransicionar } from '../../src/domain/EstadoCompra.js';
import { Roles } from '../../src/domain/Roles.js';

const DIA = 86400000;
const AHORA = new Date('2026-06-10T12:00:00');
const en = (dias, base = AHORA) => new Date(base.getTime() + dias * DIA);

let comprador;
let organizador;
let otro;
let evento;

function nuevoEvento(fecha = en(10), cupo = 10) {
  return new Evento({
    nombre: 'Recital',
    categoria: new Categoria({ id: 'cat-1', nombre: 'Música' }),
    fecha,
    organizador,
    tiposEntrada: [
      new TipoEntrada({ id: 't-gral', nombre: 'General', precio: 1000, cupo }),
      new TipoEntrada({ id: 't-vip', nombre: 'VIP', precio: 5000, cupo: 2 }),
    ],
  });
}

const crear = (cantidad = 2, ev = evento, tipoEntradaId = 't-gral', cuando = AHORA) =>
  Compra.crear({ comprador, evento: ev, tipoEntradaId, cantidad }, cuando);

beforeEach(() => {
  comprador = new Usuario({ id: 'u-1', nombre: 'Ana', apellido: 'A', email: 'a@x', roles: [Roles.COMPRADOR] });
  organizador = new Usuario({ id: 'u-2', nombre: 'Luis', apellido: 'L', email: 'l@x', roles: [Roles.ORGANIZADOR] });
  otro = new Usuario({ id: 'u-3', nombre: 'Otro', apellido: 'O', email: 'o@x', roles: [Roles.COMPRADOR] });
  evento = nuevoEvento();
});

describe('EstadoCompra', () => {
  test('transiciones válidas e inválidas', () => {
    assert.ok(puedeTransicionar(EstadoCompra.PENDIENTE, EstadoCompra.CONFIRMADA));
    assert.ok(puedeTransicionar(EstadoCompra.CANCELADA, EstadoCompra.REEMBOLSADA));
    assert.ok(!puedeTransicionar(EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA));
    assert.ok(!puedeTransicionar(EstadoCompra.PENDIENTE, EstadoCompra.UTILIZADA));
    assert.ok(!puedeTransicionar(EstadoCompra.REEMBOLSADA, EstadoCompra.CANCELADA));
  });
});

describe('Compra.crear', () => {
  test('reserva cupo, calcula total y queda PENDIENTE con historial', () => {
    const compra = crear(3);
    assert.equal(compra.estado, EstadoCompra.PENDIENTE);
    assert.equal(compra.total, 3000);
    assert.equal(evento.tipoEntrada('t-gral').cupo, 7);
    assert.deepEqual(compra.historial.map((c) => c.estado), [EstadoCompra.PENDIENTE]);
  });

  test('no permite superar el cupo', () => {
    assert.throws(() => crear(3, evento, 't-vip'), /cupo/);
    assert.equal(evento.tipoEntrada('t-vip').cupo, 2);
  });

  test('rechaza cantidades no enteras o <= 0', () => {
    assert.throws(() => crear(1.5), /entero/);
    assert.throws(() => crear(0), /entero/);
  });

  test('no permite comprar un evento pasado ni el propio', () => {
    assert.throws(() => crear(1, nuevoEvento(en(-1))), /ya se realizó/);
    organizador.roles.push(Roles.COMPRADOR);
    assert.throws(
      () => Compra.crear({ comprador: organizador, evento, tipoEntradaId: 't-gral', cantidad: 1 }, AHORA),
      /propio evento/,
    );
  });
});

describe('Pagar', () => {
  test('solo el comprador paga, una sola vez, sin tocar el cupo', () => {
    const compra = crear(2);
    assert.throws(() => compra.pagar(otro, AHORA), /comprador/);
    compra.pagar(comprador, AHORA);
    assert.equal(compra.estado, EstadoCompra.CONFIRMADA);
    assert.throws(() => compra.pagar(comprador, AHORA), /No se puede pasar/);
    assert.equal(evento.tipoEntrada('t-gral').cupo, 8, 'pagar dos veces no pierde cupo');
  });
});

describe('Cancelar y reembolsar', () => {
  test('cancelar una confirmada libera cupo y el organizador registra el reembolso', () => {
    const compra = crear(2);
    compra.pagar(comprador, AHORA);
    compra.cancelar(comprador, AHORA);
    assert.equal(compra.estado, EstadoCompra.CANCELADA);
    assert.equal(evento.tipoEntrada('t-gral').cupo, 10);
    assert.throws(() => compra.marcarReembolsada(comprador, AHORA), /organizador/);
    compra.marcarReembolsada(organizador, AHORA);
    assert.equal(compra.estado, EstadoCompra.REEMBOLSADA);
  });

  test('una pendiente cancelada no se puede reembolsar (nunca se pagó)', () => {
    const compra = crear(1);
    compra.cancelar(comprador, AHORA);
    assert.ok(!compra.accionesPara(organizador, AHORA).includes(AccionCompra.REEMBOLSAR));
    assert.throws(() => compra.marcarReembolsada(organizador, AHORA), /nunca se pagó/);
  });

  test('no se puede cancelar si el evento ya se realizó o si fue utilizada', () => {
    const compra = crear(1);
    compra.pagar(comprador, AHORA);
    assert.throws(() => compra.cancelar(comprador, en(11)), /ya se realizó/);
    compra.utilizar(organizador, en(10));
    assert.throws(() => compra.cancelar(comprador, en(10)), /utilizada/);
  });

  test('un tercero no puede cancelar', () => {
    const compra = crear(1);
    assert.throws(() => compra.cancelar(otro, AHORA), /No participás/);
  });
});

describe('Utilizar', () => {
  test('solo el organizador y desde el día del evento', () => {
    const compra = crear(1);
    compra.pagar(comprador, AHORA);
    assert.throws(() => compra.utilizar(comprador, en(10)), /organizador/);
    assert.throws(() => compra.utilizar(organizador, AHORA), /día del evento/);
    compra.utilizar(organizador, en(10));
    assert.equal(compra.estado, EstadoCompra.UTILIZADA);
  });
});

describe('Reseñar', () => {
  test('solo utilizada, después del evento, una vez y con puntaje 1..5 entero', () => {
    const compra = crear(1);
    compra.pagar(comprador, AHORA);
    assert.throws(() => compra.reseniar(comprador, { puntuacion: 5 }, AHORA), /utilizada/);
    compra.utilizar(organizador, en(10));
    assert.throws(() => compra.reseniar(comprador, { puntuacion: 6 }, en(11)), /entre 1 y 5/);
    assert.throws(() => compra.reseniar(comprador, { puntuacion: 4.5 }, en(11)), /entero/);
    const resenia = compra.reseniar(comprador, { puntuacion: 4, detalle: 'Bien' }, en(11));
    assert.equal(resenia.organizador, organizador);
    assert.throws(() => compra.reseniar(comprador, { puntuacion: 4 }, en(11)), /Ya reseñaste/);
  });
});

describe('Mensajes y acciones', () => {
  test('solo participantes chatean', () => {
    const compra = crear(1);
    compra.id = 'compra-1';
    compra.agregarMensaje(comprador, 'Hola', AHORA);
    compra.agregarMensaje(organizador, 'Hola Ana', AHORA);
    assert.equal(compra.mensajes.length, 2);
    assert.throws(() => compra.agregarMensaje(otro, 'Hola', AHORA), /No participás/);
    assert.throws(() => compra.agregarMensaje(comprador, '   ', AHORA), /vacío/);
  });

  test('accionesPara refleja las reglas para cada usuario', () => {
    const compra = crear(1);
    assert.deepEqual(compra.accionesPara(comprador, AHORA), ['pagar', 'cancelar']);
    assert.deepEqual(compra.accionesPara(organizador, AHORA), ['cancelar']);
    assert.deepEqual(compra.accionesPara(otro, AHORA), []);
  });

  test('días restantes solo para confirmadas', () => {
    const compra = crear(1);
    assert.equal(compra.diasHastaEvento(AHORA), null);
    compra.pagar(comprador, AHORA);
    assert.equal(compra.diasHastaEvento(AHORA), 10);
  });
});
