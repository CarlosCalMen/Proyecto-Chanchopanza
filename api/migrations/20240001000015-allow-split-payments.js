'use strict';

/**
 * Permite el cobro dividido: una orden puede tener VARIOS pagos vigentes
 * (por ejemplo, una parte en efectivo, otra con tarjeta y otra con Yape).
 *
 * La migración 14 creó un índice único parcial que limitaba a un solo pago
 * vigente por orden. Aquí se elimina y se reemplaza por un índice normal
 * (las claves foráneas no se indexan solas en PostgreSQL).
 *
 * La regla "los pagos suman el total de la orden" la valida el servicio dentro
 * de una transacción, con la orden bloqueada.
 */

const COMENTARIO_NUEVO =
  'Importe de este pago aplicado a la orden (la suma de los pagos vigentes iguala el total)';
const COMENTARIO_ANTERIOR =
  'Importe aplicado a la orden (igual al total de la orden)';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('pagos', 'uq_pagos_orden_registrado');
    await queryInterface.addIndex('pagos', ['orden_id'], { name: 'idx_pagos_orden_id' });
    await queryInterface.sequelize.query(
      `COMMENT ON COLUMN pagos.monto IS '${COMENTARIO_NUEVO}'`
    );
  },

  async down(queryInterface) {
    // Volver a "un pago por orden" solo es posible si no hay cobros divididos.
    const [duplicadas] = await queryInterface.sequelize.query(
      `SELECT orden_id FROM pagos
       WHERE estado = 'registrado'
       GROUP BY orden_id HAVING COUNT(*) > 1
       LIMIT 1`
    );
    if (duplicadas.length > 0) {
      throw new Error(
        'No se puede revertir: existen órdenes cobradas con más de un pago (cobro dividido). ' +
        'Anula esas órdenes o elimina esos pagos antes de revertir esta migración.'
      );
    }

    await queryInterface.removeIndex('pagos', 'idx_pagos_orden_id');
    await queryInterface.addIndex('pagos', ['orden_id'], {
      name: 'uq_pagos_orden_registrado',
      unique: true,
      where: { estado: 'registrado' },
    });
    await queryInterface.sequelize.query(
      `COMMENT ON COLUMN pagos.monto IS '${COMENTARIO_ANTERIOR}'`
    );
  },
};
