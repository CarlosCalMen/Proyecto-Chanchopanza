'use strict';

/**
 * Cliente mostrador: el cliente por defecto de las ventas sin datos del cliente
 * ('Cliente Rápido').
 *
 * Se identifica con una marca propia (es_mostrador) y NO por el texto del
 * nombre, así que se puede renombrar sin romper nada. Solo puede haber uno
 * (índice único parcial).
 *
 * Si ya existe un cliente llamado 'Cliente Rápido' (por ejemplo, el que crea el
 * seeder de demostración) se marca como mostrador en lugar de duplicarlo;
 * si no existe, se crea.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clientes', 'es_mostrador', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex('clientes', ['es_mostrador'], {
      name: 'uq_clientes_mostrador',
      unique: true,
      where: { es_mostrador: true },
    });

    const [existentes] = await queryInterface.sequelize.query(
      `SELECT id FROM clientes
       WHERE lower(nombre) IN ('cliente rápido', 'cliente rapido')
       ORDER BY id LIMIT 1`
    );

    if (existentes.length > 0) {
      await queryInterface.sequelize.query(
        'UPDATE clientes SET es_mostrador = true, updated_at = NOW() WHERE id = :id',
        { replacements: { id: existentes[0].id } }
      );
    } else {
      await queryInterface.sequelize.query(
        `INSERT INTO clientes (nombre, telefono, email, es_mostrador, created_at, updated_at)
         VALUES ('Cliente Rápido', NULL, NULL, true, NOW(), NOW())`
      );
    }
  },

  async down(queryInterface) {
    // El cliente queda como un cliente normal; solo se quita la marca.
    await queryInterface.removeIndex('clientes', 'uq_clientes_mostrador');
    await queryInterface.removeColumn('clientes', 'es_mostrador');
  },
};
