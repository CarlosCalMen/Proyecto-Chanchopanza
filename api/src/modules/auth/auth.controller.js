'use strict';

const authService = require('./auth.service');
const apiResponse = require('../../helpers/apiResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

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
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

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
 * Requiere authMiddleware — req.usuario ya está populado.
 */
const me = async (req, res, next) => {
  try {
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Usuario autenticado',
      data: req.usuario,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, me };
