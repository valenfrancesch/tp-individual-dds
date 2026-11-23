import { crearRepositorio } from './memoryStore.js';

export const { findAll, findById, save } = crearRepositorio('categorias', 'categoria');
