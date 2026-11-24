'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Obtener ids de usuarios y sucursales dinámicamente
    const usuarios = await queryInterface.sequelize.query(
      `SELECT id, nombre_usuario FROM usuarios
       WHERE nombre_usuario IN ('admin','socio','cajero')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const sucursales = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM sucursales
       WHERE nombre IN ('Sucursal Central','Sucursal Norte')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const usuarioId  = (nombre) => usuarios.find((u) => u.nombre_usuario === nombre)?.id;
    const sucursalId = (nombre) => sucursales.find((s) => s.nombre === nombre)?.id;

    await queryInterface.bulkInsert('empleados', [
      {
        usuario_id:  usuarioId('admin'),
        sucursal_id: sucursalId('Sucursal Central'),
        nombre:      'Carlos',
        apellidos:   'Administrador',
        telefono:    '999-111-001',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        usuario_id:  usuarioId('socio'),
        sucursal_id: sucursalId('Sucursal Central'),
        nombre:      'María',
        apellidos:   'Socia',
        telefono:    '999-111-002',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        usuario_id:  usuarioId('cajero'),
        sucursal_id: sucursalId('Sucursal Central'),
        nombre:      'Pedro',
        apellidos:   'Cajero',
        telefono:    '999-111-003',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    // Eliminar empleados vinculados a los usuarios de prueba
    await queryInterface.sequelize.query(
      `DELETE FROM empleados
       WHERE usuario_id IN (
         SELECT id FROM usuarios
         WHERE nombre_usuario IN ('admin','socio','cajero')
       )`
    );
  },
};
