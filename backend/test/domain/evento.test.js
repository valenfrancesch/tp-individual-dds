import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Usuario } from '../../src/domain/Usuario.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { Evento } from '../../src/domain/Evento.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Roles } from '../../src/domain/Roles.js';

const organizador = new Usuario({ id: 'u-1', nombre: 'L', apellido: 'L', email: 'l@x', roles: [Roles.ORGANIZADOR] });
const categoria = new Categoria({ id: 'c-1', nombre: 'Teatro' });
const AHORA = new Date('2026-06-10T12:00:00');

const datos = (extra = {}) => ({
  nombre: 'Hamlet en el Colón',
  descripcion: 'Shakespeare',
  categoria,
  fecha: new Date('2026-07-01T20:00:00'),
  organizador,
  tiposEntrada: [
    new TipoEntrada({ nombre: 'Popular', precio: 8000, cupo: 10 }),
    new TipoEntrada({ nombre: 'Platea', precio: 18000, cupo: 10 }),
  ],
  ...extra,
});

describe('TipoEntrada', () => {
  test('valida precio y cupo', () => {
    assert.throws(() => new TipoEntrada({ nombre: 'X', precio: 0, cupo: 1 }), /precio/);
    assert.throws(() => new TipoEntrada({ nombre: 'X', precio: 10, cupo: 1.5 }), /cupo/);
    assert.throws(() => new TipoEntrada({ nombre: '', precio: 10, cupo: 1 }), /nombre/);
  });
});

describe('Evento', () => {
  test('tuPrecioEstaEntre: alcanza con que un tipo esté en rango', () => {
    const e = new Evento(datos());
    assert.ok(e.tuPrecioEstaEntre(15000, 20000), 'Platea 18000 entra aunque el mínimo sea 8000');
    assert.ok(!e.tuPrecioEstaEntre(9000, 15000));
    assert.ok(e.tuPrecioEstaEntre(null, 8000));
    assert.ok(e.tuPrecioEstaEntre(undefined, undefined));
  });

  test('publicar exige fecha futura', () => {
    assert.throws(
      () => Evento.publicar(datos({ fecha: new Date('2026-01-01') }), AHORA),
      /futura/,
    );
    assert.ok(Evento.publicar(datos(), AHORA));
  });

  test('valida estructura', () => {
    assert.throws(() => new Evento(datos({ tiposEntrada: [] })), /tipo de entrada/);
    assert.throws(() => new Evento(datos({ fecha: 'no-fecha' })), /fecha/);
    assert.throws(() => new Evento(datos({ multimedia: ['ftp://x'] })), /URL/);
  });

  test('búsqueda sin acentos ni mayúsculas', () => {
    const e = new Evento(datos());
    assert.ok(e.coincideCon('colon'));
    assert.ok(e.coincideCon('TEATRO'));
    assert.ok(!e.coincideCon('futbol'));
  });

  test('fechas: día del evento y si ya se realizó', () => {
    const e = new Evento(datos());
    assert.ok(!e.esElDiaOPosterior(AHORA));
    assert.ok(e.esElDiaOPosterior(new Date('2026-07-01T08:00:00')));
    assert.ok(!e.yaSeRealizo(new Date('2026-07-01T08:00:00')));
    assert.ok(e.yaSeRealizo(new Date('2026-07-02T08:00:00')));
  });
});

describe('Usuario favoritos', () => {
  test('agregar y quitar son idempotentes', () => {
    const u = new Usuario({ nombre: 'A', apellido: 'A', email: 'a@x', roles: [Roles.COMPRADOR] });
    const e = new Evento(datos());
    u.agregarFavorito(e);
    u.agregarFavorito(e);
    assert.equal(u.favoritos.length, 1);
    u.quitarFavorito(e);
    u.quitarFavorito(e);
    assert.equal(u.favoritos.length, 0);
  });
});
