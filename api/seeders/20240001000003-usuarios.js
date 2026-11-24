'use strict';

/**
 * Usuarios iniciales del sistema.
 *
 * Contraseñas en texto plano (solo para referencia — NO se almacenan así):
 *   admin   → Admin2024!
 *   socio   → Socio2024!
 *   cajero  → Caja2024!
 *
 * Los hashes se generaron con bcrypt (saltRounds: 12).
 * Para cambiar una contraseña, genera un nuevo hash con:
 *   node -e "require('bcryptjs').hash('NuevaPassword', 12).then(console.log)"
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Obtener ids de perfiles dinámicamente para evitar asumir el id
    const perfiles = await queryInterface.sequelize.query(
      `SELECT id, etiqueta_perfil FROM perfiles
       WHERE etiqueta_perfil IN ('admin','socio','caja')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const perfilId = (etiqueta) =>
      perfiles.find((p) => p.etiqueta_perfil === etiqueta)?.id;

    await queryInterface.bulkInsert('usuarios', [
      {
        perfil_id:     perfilId('admin'),
        nombre_usuario:'admin',
        password_hash: '$2b$12$7iroUPx8DXeYEbLum1ZDaeyOrBeoPXMi.PQl1xAQ4NntQq9U4dR3i',
        activo:        true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
      {
        perfil_id:     perfilId('socio'),
        nombre_usuario:'socio',
        password_hash: '$2b$12$I.cBaqEJQjVT6uJa4oHo8uYc1S4bpZf8NpH3mpnHWFUgPLQkG5hVm',
        activo:        true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
      {
        perfil_id:     perfilId('caja'),
        nombre_usuario:'cajero',
        password_hash: '$2b$12$RNhkc5y2e3XHzHj6ACEqNuj5bP4P2cQp3TkJPOFv5BidVuLMqsS3a',
        activo:        true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      nombre_usuario: ['admin', 'socio', 'cajero'],
    });
  },
};
