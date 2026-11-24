'use strict';

const jwt      = require('jsonwebtoken');
const AppError = require('../helpers/AppError');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * authMiddleware
 *
 * Verifica el Bearer token del header Authorization.
 * Si es válido, popula req.usuario con el payload decodificado:
 *   { id, nombreUsuario, rol, sucursalId }
 *
 * Roles disponibles: 'admin' | 'socio' | 'caja'
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Header de autorización ausente o mal formado', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    req.usuario = {
      id:            decoded.sub,
      nombreUsuario: decoded.nombreUsuario,
      rol:           decoded.rol,           // 'admin' | 'socio' | 'caja'
      sucursalId:    decoded.sucursalId,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expirado', 401));
    }
    return next(new AppError('Access token inválido', 401));
  }
};

module.exports = authMiddleware;
