'use strict';

const AppError = require('../helpers/AppError');

/**
 * roleMiddleware
 *
 * Factory que retorna un middleware que permite solo los roles indicados.
 * Debe usarse DESPUÉS de authMiddleware (requiere req.usuario).
 *
 * Roles del sistema:
 *   admin → acceso total
 *   socio → solo lectura en reportes (sin crear/editar/eliminar)
 *   caja  → solo registro de ventas y cobros
 *
 * Uso:
 *   router.delete('/productos/:id',
 *     authMiddleware,
 *     roleMiddleware('admin'),
 *     productoController.eliminar
 *   );
 *
 *   router.get('/reportes',
 *     authMiddleware,
 *     roleMiddleware('admin', 'socio'),
 *     reporteController.resumen
 *   );
 */
const roleMiddleware = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return next(new AppError('Solicitud no autenticada', 401));
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return next(
      new AppError(
        `Acceso denegado. Rol(es) requerido(s): ${rolesPermitidos.join(', ')}`,
        403
      )
    );
  }

  return next();
};

module.exports = roleMiddleware;
