'use strict';

const authService = require('./auth.service');
const apiResponse = require('../../helpers/apiResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

// clearCookie no admite maxAge (obsoleto en Express 5)
const { maxAge, ...CLEAR_COOKIE_OPTIONS } = COOKIE_OPTIONS;

/**
 * POST /api/auth/login
 * Body: { nombreUsuario, password }
 */
const login = async (req, res, next) => {
  try {
    const { nombreUsuario, password } = req.body;
    const result = await authService.login(nombreUsuario, password);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Inicio de sesión exitoso',
      data: {
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
        usuario:      result.usuario,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refresh(token);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Token renovado correctamente',
      data: {
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    authService.logout(token);
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Sesión cerrada correctamente',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Devuelve los datos actuales del usuario autenticado (leídos de la BD):
 * perfil, empleado y sucursal.
 */
const me = async (req, res, next) => {
  try {
    const data = await authService.getMe(req.usuario.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Usuario autenticado',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/password
 * Body: { passwordActual, passwordNueva }
 * Cambia la contraseña propia y cierra todas las sesiones del usuario.
 */
const changePassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    await authService.changePassword(req.usuario.id, passwordActual, passwordNueva);
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Contraseña actualizada. Inicia sesión nuevamente.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, me, changePassword };
