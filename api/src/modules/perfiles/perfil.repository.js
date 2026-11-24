'use strict';

const { Perfil } = require('../../config/db');

const findAll = async () => Perfil.findAll({ order: [['id', 'ASC']] });

module.exports = { findAll };
