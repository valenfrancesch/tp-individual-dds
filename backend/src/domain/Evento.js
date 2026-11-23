import { badRequest } from '../errors/AppError.js';
import { includesNormalized } from '../utils/normalizeText.js';
import { TipoEntrada } from './TipoEntrada.js';

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function esUrlValida(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export class Evento {
  constructor({
    id = null,
    nombre,
    descripcion = '',
    categoria,
    fecha,
    direccion = '',
    tiposEntrada = [],
    multimedia = [],
    organizador,
  }) {
    if (!String(nombre ?? '').trim()) throw badRequest('El nombre es obligatorio');
    if (!categoria) throw badRequest('La categoría es obligatoria');
    if (!organizador) throw badRequest('El evento necesita un organizador');
    const fechaDate = new Date(fecha);
    if (!fecha || Number.isNaN(fechaDate.getTime())) {
      throw badRequest('La fecha del evento no es válida');
    }
    if (!tiposEntrada.length) {
      throw badRequest('El evento necesita al menos un tipo de entrada');
    }
    if (!tiposEntrada.every((t) => t instanceof TipoEntrada)) {
      throw badRequest('Tipos de entrada inválidos');
    }
    const urls = multimedia.map((u) => String(u).trim()).filter(Boolean);
    const invalida = urls.find((u) => !esUrlValida(u));
    if (invalida) throw badRequest(`URL de imagen inválida: ${invalida}`);

    this.id = id;
    this.nombre = String(nombre).trim();
    this.descripcion = descripcion || '';
    this.categoria = categoria;
    this.fecha = fechaDate;
    this.direccion = direccion || '';
    this.tiposEntrada = tiposEntrada;
    this.multimedia = urls;
    this.organizador = organizador;
  }

  /** Alta de un evento nuevo: además de lo estructural, exige fecha futura. */
  static publicar(datos, ahora = new Date()) {
    const evento = new Evento(datos);
    if (evento.fecha <= ahora) {
      throw badRequest('La fecha del evento debe ser futura');
    }
    return evento;
  }

  tipoEntrada(tipoEntradaId) {
    return this.tiposEntrada.find((t) => t.id === tipoEntradaId) || null;
  }

  precioMinimo() {
    return Math.min(...this.tiposEntrada.map((t) => t.precio));
  }

  /**
   * True si algún tipo de entrada tiene precio dentro de [min, max].
   * min/max son opcionales (null/undefined = sin límite).
   */
  tuPrecioEstaEntre(min, max) {
    const lo = min == null || min === '' ? -Infinity : Number(min);
    const hi = max == null || max === '' ? Infinity : Number(max);
    return this.tiposEntrada.some((t) => t.precio >= lo && t.precio <= hi);
  }

  cupoTotalDisponible() {
    return this.tiposEntrada.reduce((acc, t) => acc + t.cupo, 0);
  }

  yaSeRealizo(ahora = new Date()) {
    return this.fecha < ahora;
  }

  /** True desde las 00:00 del día del evento en adelante. */
  esElDiaOPosterior(ahora = new Date()) {
    return inicioDelDia(ahora) >= inicioDelDia(this.fecha);
  }

  diasHasta(ahora = new Date()) {
    const ms = inicioDelDia(this.fecha) - inicioDelDia(ahora);
    return Math.round(ms / 86400000);
  }

  esOrganizadoPor(usuario) {
    return !!usuario && this.organizador.id === usuario.id;
  }

  coincideCon(texto) {
    if (!texto) return true;
    return [this.nombre, this.descripcion, this.direccion, this.categoria?.nombre].some(
      (campo) => includesNormalized(campo, texto),
    );
  }
}
