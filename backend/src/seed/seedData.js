import { resetStore } from '../repositories/memoryStore.js';
import * as usuarioRepository from '../repositories/usuarioRepository.js';
import * as categoriaRepository from '../repositories/categoriaRepository.js';
import * as eventoRepository from '../repositories/eventoRepository.js';
import * as compraRepository from '../repositories/compraRepository.js';
import * as reseniaRepository from '../repositories/reseniaRepository.js';
import { Usuario } from '../domain/Usuario.js';
import { Categoria } from '../domain/Categoria.js';
import { Evento } from '../domain/Evento.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { Compra } from '../domain/Compra.js';
import { Roles } from '../domain/Roles.js';
import { hashPassword } from '../auth/password.js';

/** Credenciales demo (solo docs/consola; en el store se guarda el hash). */
export const SEED_PLAIN_PASSWORDS = {
  'ana@ticket.it': 'ana123',
  'luis@ticket.it': 'luis123',
  'maria@ticket.it': 'maria123',
};

const DIA = 86400000;

/** Fecha relativa a `ahora`: días (negativos = pasado) a una hora dada. */
function dias(ahora, n, hora = 21) {
  const d = new Date(ahora.getTime() + n * DIA);
  d.setHours(hora, 0, 0, 0);
  return d;
}

/** Un horario de hoy que todavía no pasó (para poder marcar "utilizada" hoy). */
function hoyMasTarde(ahora) {
  const finDelDia = new Date(ahora);
  finDelDia.setHours(23, 59, 0, 0);
  return new Date(Math.min(ahora.getTime() + 2 * 3600000, finDelDia.getTime()));
}

const tipo = (nombre, descripcion, precio, cupo) =>
  new TipoEntrada({ nombre, descripcion, precio, cupo });

/**
 * Siembra datos usando las mismas operaciones de dominio que la API,
 * con un "reloj" simulado para generar historia (compras pasadas, reseñas).
 * Escenarios para la demo (logueado como Ana):
 *  - Rock Night: CONFIRMADA con chat y días restantes
 *  - Hamlet Pullman: PENDIENTE (botón Pagar)
 *  - Hamlet Platea: CANCELADA ya pagada (Luis puede "Marcar reembolsada")
 *  - Jazz (hoy): CONFIRMADA (Luis puede "Marcar utilizada")
 *  - Stand-up (pasado): UTILIZADA sin reseña (Ana puede reseñar)
 *  - Maratón (pasado, de María): UTILIZADA con reseña
 */
export async function seedDatabase(ahora = new Date()) {
  resetStore();

  const crearUsuario = async (nombre, apellido, email, roles) =>
    usuarioRepository.save(
      new Usuario({
        nombre,
        apellido,
        email,
        roles,
        passwordHash: await hashPassword(SEED_PLAIN_PASSWORDS[email]),
      }),
    );

  const ana = await crearUsuario('Ana', 'Compradora', 'ana@ticket.it', [Roles.COMPRADOR]);
  const luis = await crearUsuario('Luis', 'Organizador', 'luis@ticket.it', [Roles.ORGANIZADOR]);
  const maria = await crearUsuario('María', 'Dual', 'maria@ticket.it', [
    Roles.COMPRADOR,
    Roles.ORGANIZADOR,
  ]);

  const [musica, teatro, deportes, humor] = [
    new Categoria({ nombre: 'Música', descripcion: 'Recitales y festivales', icono: 'musical-notes' }),
    new Categoria({ nombre: 'Teatro', descripcion: 'Obras y musicales', icono: 'film' }),
    new Categoria({ nombre: 'Deportes', descripcion: 'Eventos deportivos', icono: 'football' }),
    new Categoria({ nombre: 'Humor', descripcion: 'Stand-up y comedia', icono: 'happy' }),
  ].map(categoriaRepository.save);

  const evento = (datos) => eventoRepository.save(new Evento(datos));

  const rockNight = evento({
    nombre: 'Rock Night Buenos Aires',
    descripcion: 'Noche de rock nacional con bandas invitadas.',
    categoria: musica,
    fecha: dias(ahora, 20),
    direccion: 'Av. Sarmiento 2601, Palermo, CABA',
    multimedia: [
      'https://picsum.photos/seed/rock/800/400',
      'https://picsum.photos/seed/rock2/800/400',
    ],
    organizador: luis,
    tiposEntrada: [
      tipo('General', 'Acceso general de pie', 15000, 100),
      tipo('VIP', 'Acceso VIP + meet & greet', 35000, 20),
    ],
  });

  const hamlet = evento({
    nombre: 'Hamlet en el Colón',
    descripcion: 'Clásico de Shakespeare en versión contemporánea.',
    categoria: teatro,
    fecha: dias(ahora, 45, 20),
    direccion: 'Cerrito 628, Teatro Colón, CABA',
    multimedia: ['https://picsum.photos/seed/teatro/800/400'],
    organizador: luis,
    tiposEntrada: [
      tipo('Platea', 'Platea central', 22000, 80),
      tipo('Pullman', 'Sector superior', 12000, 120),
    ],
  });

  const jazz = evento({
    nombre: 'Jazz al Atardecer',
    descripcion: 'Cuarteto de jazz en vivo en la terraza. ¡Es hoy!',
    categoria: musica,
    fecha: hoyMasTarde(ahora),
    direccion: 'Defensa 1344, San Telmo, CABA',
    multimedia: ['https://picsum.photos/seed/jazz/800/400'],
    organizador: luis,
    tiposEntrada: [tipo('General', 'Mesa compartida', 9000, 40)],
  });

  const standUp = evento({
    nombre: 'Stand-up de los Jueves',
    descripcion: 'Cuatro comediantes, un micrófono y mucha improvisación.',
    categoria: humor,
    fecha: dias(ahora, -7, 22),
    direccion: 'Av. Corrientes 1500, CABA',
    multimedia: ['https://picsum.photos/seed/standup/800/400'],
    organizador: luis,
    tiposEntrada: [tipo('General', 'Butaca numerada', 7000, 60)],
  });

  const clasico = evento({
    nombre: 'Clásico de Verano',
    descripcion: 'Partido amistoso de fútbol en cancha abierta.',
    categoria: deportes,
    fecha: dias(ahora, 10, 18),
    direccion: 'Av. Figueroa Alcorta 7597, CABA',
    multimedia: ['https://picsum.photos/seed/futbol/800/400'],
    organizador: maria,
    tiposEntrada: [
      tipo('Popular', 'Tribuna popular', 8000, 200),
      tipo('Platea', 'Platea cubierta', 18000, 50),
    ],
  });

  const maraton = evento({
    nombre: 'Maratón Solidaria 10K',
    descripcion: 'Carrera a beneficio con kit de corredor incluido.',
    categoria: deportes,
    fecha: dias(ahora, -30, 8),
    direccion: 'Parque Tres de Febrero, CABA',
    multimedia: ['https://picsum.photos/seed/maraton/800/400'],
    organizador: maria,
    tiposEntrada: [tipo('Corredor', 'Inscripción + kit', 5000, 300)],
  });

  ana.agregarFavorito(rockNight);
  ana.agregarFavorito(jazz);

  const comprar = (comprador, ev, tipoIdx, cantidad, cuando) =>
    compraRepository.save(
      Compra.crear(
        { comprador, evento: ev, tipoEntradaId: ev.tiposEntrada[tipoIdx].id, cantidad },
        cuando,
      ),
    );

  // Ana: Rock Night confirmada + chat
  const c1 = comprar(ana, rockNight, 0, 2, dias(ahora, -3, 10));
  c1.pagar(ana, dias(ahora, -3, 10));
  c1.agregarMensaje(ana, '¡Hola! ¿A qué hora abren las puertas?', dias(ahora, -2, 11));
  c1.agregarMensaje(luis, 'Hola Ana, abrimos a las 19 hs. ¡Te esperamos!', dias(ahora, -2, 12));

  // Ana: Hamlet Pullman pendiente de pago
  comprar(ana, hamlet, 1, 1, dias(ahora, -1, 15));

  // Ana: Hamlet Platea pagada y cancelada (reembolso pendiente del organizador)
  const c3 = comprar(ana, hamlet, 0, 2, dias(ahora, -5, 9));
  c3.pagar(ana, dias(ahora, -5, 9));
  c3.cancelar(ana, dias(ahora, -1, 18));

  // Ana: Jazz de hoy confirmada (Luis puede marcarla utilizada)
  const c4 = comprar(ana, jazz, 0, 2, dias(ahora, -2, 16));
  c4.pagar(ana, dias(ahora, -2, 16));

  // Ana: Stand-up pasado, utilizada y sin reseña
  const c5 = comprar(ana, standUp, 0, 1, dias(ahora, -12, 13));
  c5.pagar(ana, dias(ahora, -12, 13));
  c5.utilizar(luis, dias(ahora, -7, 21));

  // María (como compradora): Stand-up utilizada con reseña
  const c6 = comprar(maria, standUp, 0, 2, dias(ahora, -10, 10));
  c6.pagar(maria, dias(ahora, -10, 10));
  c6.utilizar(luis, dias(ahora, -7, 21));
  reseniaRepository.save(
    c6.reseniar(maria, { puntuacion: 5, detalle: 'Muy divertido y todo puntual.' }, dias(ahora, -6)),
  );

  // María: Rock Night VIP confirmada
  const c7 = comprar(maria, rockNight, 1, 1, dias(ahora, -4, 20));
  c7.pagar(maria, dias(ahora, -4, 20));

  // Ana: Maratón (organiza María) utilizada con reseña
  const c8 = comprar(ana, maraton, 0, 1, dias(ahora, -40, 9));
  c8.pagar(ana, dias(ahora, -40, 9));
  c8.utilizar(maria, dias(ahora, -30, 7));
  reseniaRepository.save(
    c8.reseniar(
      ana,
      { puntuacion: 4, detalle: 'Muy buena organización y ambiente familiar.' },
      dias(ahora, -29),
    ),
  );

  return {
    usuarios: [ana, luis, maria].map((u) => ({
      email: u.email,
      password: SEED_PLAIN_PASSWORDS[u.email],
      roles: u.roles,
    })),
  };
}
