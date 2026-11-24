'use strict';

/**
 * Corrige las contraseñas de 'socio' y 'cajero'.
 *
 * El seeder 03 original traía hashes inválidos para esos dos usuarios,
 * por lo que no podían iniciar sesión. Este seeder los actualiza sin tocar
 * ningún otro dato. Es seguro ejecutarlo más de una vez.
 *
 *   npx sequelize-cli db:seed --seed 20240001000006-fix-passwords.js
 *
 * Contraseñas resultantes:  socio -> Socio2024!   |   cajero -> Caja2024!
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const fixes = [
      { usuario: 'socio',  hash: '$2a$12$HDSPVLJHVVq5nvINzYVmOukCXgAl2ae4k8oVECkMMg5rK.QLIZwne' },
      { usuario: 'cajero', hash: '$2a$12$5iJ5Zcu3HUsgYMwOEjzl2..K6GzEYwT96TQB.oxnqfFk.lt0BWkoi' },
    ];

    for (const f of fixes) {
      await queryInterface.bulkUpdate(
        'usuarios',
        { password_hash: f.hash, updated_at: new Date() },
        { nombre_usuario: f.usuario }
      );
    }
  },

  async down() {
    // Sin reversión: no se restauran hashes inválidos.
  },
};
