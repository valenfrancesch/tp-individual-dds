import { resetStore, nextId } from '../repositories/memoryStore.js';
import * as usuarioRepository from '../repositories/usuarioRepository.js';
import * as categoriaRepository from '../repositories/categoriaRepository.js';
import * as eventoRepository from '../repositories/eventoRepository.js';
import * as compraRepository from '../repositories/compraRepository.js';
import * as reseniaRepository from '../repositories/reseniaRepository.js';
import { crearUsuario } from '../domain/Usuario.js';
import { crearCategoria } from '../domain/Categoria.js';
import { crearEvento } from '../domain/Evento.js';
import { crearTipoEntrada } from '../domain/TipoEntrada.js';
import { crearCompra, crearItemCompra } from '../domain/Compra.js';
import { crearResenia } from '../domain/Resenia.js';
import { EstadoCompra } from '../domain/EstadoCompra.js';
import { Roles } from '../domain/Roles.js';
import { crearCambioEstadoCompra } from '../domain/CambioEstadoCompra.js';
import { hashPassword } from '../auth/password.js';

/** Credenciales demo (solo docs/consola; en store se guarda el hash). */
export const SEED_PLAIN_PASSWORDS = {
  'ana@ticket.it': 'ana123',
  'luis@ticket.it': 'luis123',
  'maria@ticket.it': 'maria123',
};

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function seedDatabase() {
  resetStore();

  const ana = crearUsuario({
    id: nextId('usuario'),
    nombre: 'Ana',
    apellido: 'Compradora',
    email: 'ana@ticket.it',
    password: await hashPassword(SEED_PLAIN_PASSWORDS['ana@ticket.it']),
    roles: [Roles.COMPRADOR],
    favoritos: [],
  });

  const luis = crearUsuario({
    id: nextId('usuario'),
    nombre: 'Luis',
    apellido: 'Organizador',
    email: 'luis@ticket.it',
    password: await hashPassword(SEED_PLAIN_PASSWORDS['luis@ticket.it']),
    roles: [Roles.ORGANIZADOR],
    favoritos: [],
  });

  const maria = crearUsuario({
    id: nextId('usuario'),
    nombre: 'Maria',
    apellido: 'Dual',
    email: 'maria@ticket.it',
    password: await hashPassword(SEED_PLAIN_PASSWORDS['maria@ticket.it']),
    roles: [Roles.COMPRADOR, Roles.ORGANIZADOR],
    favoritos: [],
  });

  [ana, luis, maria].forEach(usuarioRepository.save);

  const musica = crearCategoria({
    id: nextId('categoria'),
    nombre: 'Música',
    descripcion: 'Recitales y festivales',
    icono: 'musical-notes',
  });
  const teatro = crearCategoria({
    id: nextId('categoria'),
    nombre: 'Teatro',
    descripcion: 'Obras y musicales',
    icono: 'film',
  });
  const deportes = crearCategoria({
    id: nextId('categoria'),
    nombre: 'Deportes',
    descripcion: 'Eventos deportivos',
    icono: 'football',
  });
  [musica, teatro, deportes].forEach(categoriaRepository.save);

  const rockNight = crearEvento({
    id: nextId('evento'),
    nombre: 'Rock Night Buenos Aires',
    descripcion: 'Noche de rock nacional con bandas invitadas.',
    categoriaId: musica.id,
    fecha: daysFromNow(20),
    direccion: 'Av. Sarmiento 2601, Palermo, CABA',
    multimedia: ['https://picsum.photos/seed/rock/800/400'],
    organizadorId: luis.id,
    tiposEntrada: [
      crearTipoEntrada({
        id: nextId('tipoEntrada'),
        nombre: 'General',
        descripcion: 'Acceso general',
        precio: 15000,
        cupo: 100,
      }),
      crearTipoEntrada({
        id: nextId('tipoEntrada'),
        nombre: 'VIP',
        descripcion: 'Acceso VIP + meet & greet',
        precio: 35000,
        cupo: 20,
      }),
    ],
  });

  const hamlet = crearEvento({
    id: nextId('evento'),
    nombre: 'Hamlet en el Colón',
    descripcion: 'Clásico de Shakespeare en versión contemporánea.',
    categoriaId: teatro.id,
    fecha: daysFromNow(45),
    direccion: 'Cerrito 628, Teatro Colón, CABA',
    multimedia: ['https://picsum.photos/seed/teatro/800/400'],
    organizadorId: luis.id,
    tiposEntrada: [
      crearTipoEntrada({
        id: nextId('tipoEntrada'),
        nombre: 'Platea',
        descripcion: 'Platea central',
        precio: 22000,
        cupo: 80,
      }),
      crearTipoEntrada({
        id: nextId('tipoEntrada'),
        nombre: 'Pullman',
        descripcion: 'Sector superior',
        precio: 12000,
        cupo: 120,
      }),
    ],
  });

  const clasico = crearEvento({
    id: nextId('evento'),
    nombre: 'Clásico de Verano',
    descripcion: 'Partido amistoso de fútbol en cancha abierta.',
    categoriaId: deportes.id,
    fecha: daysFromNow(10),
    direccion: 'Av. Figueroa Alcorta 7597, CABA',
    multimedia: ['https://picsum.photos/seed/futbol/800/400'],
    organizadorId: maria.id,
    tiposEntrada: [
      crearTipoEntrada({
        id: nextId('tipoEntrada'),
        nombre: 'Popular',
        descripcion: 'Tribuna popular',
        precio: 8000,
        cupo: 200,
      }),
      crearTipoEntrada({
        id: nextId('tipoEntrada'),
        nombre: 'Platea',
        descripcion: 'Platea cubierta',
        precio: 18000,
        cupo: 50,
      }),
    ],
  });

  [rockNight, hamlet, clasico].forEach(eventoRepository.save);

  ana.favoritos.push(rockNight.id);
  usuarioRepository.update(ana);

  const itemsConfirmada = [
    crearItemCompra({
      tipoEntradaId: rockNight.tiposEntrada[0].id,
      cantidad: 2,
      precioUnitario: 15000,
    }),
  ];
  const compraConfirmada = crearCompra({
    id: nextId('compra'),
    compradorId: ana.id,
    eventoId: rockNight.id,
    items: itemsConfirmada,
    total: itemsConfirmada.reduce((a, i) => a + i.subtotal, 0),
    estado: EstadoCompra.CONFIRMADA,
  });
  rockNight.tiposEntrada[0].cupo -= 2;
  eventoRepository.update(rockNight);
  compraRepository.save(compraConfirmada);
  compraRepository.saveCambioEstado(
    crearCambioEstadoCompra({
      id: nextId('cambioEstado'),
      compraId: compraConfirmada.id,
      estado: EstadoCompra.CONFIRMADA,
      quienId: ana.id,
    }),
  );

  const itemsUtilizada = [
    crearItemCompra({
      tipoEntradaId: clasico.tiposEntrada[0].id,
      cantidad: 1,
      precioUnitario: 8000,
    }),
  ];
  const compraUtilizada = crearCompra({
    id: nextId('compra'),
    compradorId: ana.id,
    eventoId: clasico.id,
    items: itemsUtilizada,
    total: 8000,
    estado: EstadoCompra.UTILIZADA,
  });
  clasico.tiposEntrada[0].cupo -= 1;
  eventoRepository.update(clasico);
  compraRepository.save(compraUtilizada);

  const resenia = crearResenia({
    id: nextId('resenia'),
    compradorId: ana.id,
    eventoId: clasico.id,
    organizadorId: maria.id,
    detalle: 'Muy buena organización y ambiente familiar.',
    puntuacion: 4.5,
  });
  resenia.compraId = compraUtilizada.id;
  reseniaRepository.save(resenia);

  return {
    usuarios: [ana, luis, maria].map((u) => ({
      email: u.email,
      password: SEED_PLAIN_PASSWORDS[u.email],
      roles: u.roles,
    })),
  };
}
