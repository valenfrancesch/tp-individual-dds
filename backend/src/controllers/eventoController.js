import * as eventoService from '../services/eventoService.js';
import * as reseniaService from '../services/reseniaService.js';
import { eventoJSON, eventoDetalleJSON } from '../presenters/eventoPresenter.js';
import { usuarioPerfil } from '../presenters/usuarioPresenter.js';
import { reseniaJSON } from '../presenters/reseniaPresenter.js';

export function listarCategorias(_req, res) {
  res.json(eventoService.listarCategorias());
}

export function listarEventos(req, res) {
  const eventos = eventoService.listarEventos(req.query, req.user);
  res.json(eventos.map((e) => eventoJSON(e, req.user)));
}

export function obtenerEvento(req, res) {
  res.json(eventoDetalleJSON(eventoService.obtenerEvento(req.params.id), req.user));
}

export function crearEvento(req, res) {
  const evento = eventoService.crearEvento(req.user, req.body);
  res.status(201).json(eventoDetalleJSON(evento, req.user));
}

export function misEventos(req, res) {
  res.json(eventoService.listarMisEventos(req.user).map((e) => eventoJSON(e, req.user)));
}

export function listarFavoritos(req, res) {
  res.json(eventoService.listarFavoritos(req.user).map((e) => eventoJSON(e, req.user)));
}

export function agregarFavorito(req, res) {
  res.json(usuarioPerfil(eventoService.agregarFavorito(req.user, req.params.eventoId)));
}

export function quitarFavorito(req, res) {
  res.json(usuarioPerfil(eventoService.quitarFavorito(req.user, req.params.eventoId)));
}

export function misResenias(req, res) {
  res.json(reseniaService.reseniasRecibidas(req.user).map(reseniaJSON));
}
