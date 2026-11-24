'use strict';

const perfilRepository = require('./perfil.repository');

const listPerfiles = async () => perfilRepository.findAll();

module.exports = { listPerfiles };
