'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const authRepository = require('./auth.repository');
const AppError       = require('../../helpers/AppError');

// ── Token config ──────────────────────────────────────────────────────────────
const ACCESS_SECRET       = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET      = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN   = process.env.JWT_ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXPIRES_IN  = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Store en memoria de refresh tokens.
 * Reemplazar con Redis o tabla DB en producción multi-instancia.
 * Estructura: Map<hashToken, { usuarioId, expiresAt }>
 */
const refreshTokenStore = new Map();

// ── Helpers privados ──────────────────────────────────────────────────────────

const buildPayload = (usuario) => ({
  sub:          usuario.id,
  nombreUsuario: usuario.nombreUsuario,
  rol:          usuario.perfil.etiquetaPerfil,   // 'admin' | 'socio' | 'caja'
  sucursalId:   usuario.empleado?.sucursalId ?? null,
});

const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

const signRefreshToken = (payload) => {
  const raw   = crypto.randomBytes(40).toString('hex');
  const token = jwt.sign({ ...payload, jti: raw }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
  const hash      = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + parseDuration(REFRESH_EXPIRES_IN);
  refreshTokenStore.set(hash, { usuarioId: payload.sub, expiresAt });
  return token;
};

const parseDuration = (str) => {
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = String(str).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Formato de duración inválido: ${str}`);
  return parseInt(match[1], 10) * units[match[2]];
};

// ── Métodos públicos ──────────────────────────────────────────────────────────

const login = async (nombreUsuario, plainPassword) => {
  const usuario = await authRepository.findByUsername(nombreUsuario);
  if (!usuario) throw new AppError('Credenciales inválidas', 401);

  const passwordMatch = await bcrypt.compare(plainPassword, usuario.passwordHash);
  if (!passwordMatch) throw new AppError('Credenciales inválidas', 401);

  const payload      = buildPayload(usuario);
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    usuario: {
      id:            usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol:           usuario.perfil.etiquetaPerfil,
      sucursalId:    payload.sucursalId,
    },
  };
};

const refresh = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_SECRET);
  } catch {
    throw new AppError('Refresh token inválido o expirado', 401);
  }

  const hash  = crypto.createHash('sha256').update(token).digest('hex');
  const entry = refreshTokenStore.get(hash);
  if (!entry || entry.expiresAt < Date.now()) {
    refreshTokenStore.delete(hash);
    throw new AppError('Refresh token revocado o expirado', 401);
  }

  const usuario = await authRepository.findById(decoded.sub);
  if (!usuario || !usuario.activo) throw new AppError('Usuario no encontrado o inactivo', 401);

  refreshTokenStore.delete(hash);

  const payload     = buildPayload(usuario);
  const accessToken = signAccessToken(payload);
  const newRefresh  = signRefreshToken(payload);

  return { accessToken, refreshToken: newRefresh };
};

const logout = (token) => {
  if (!token) return;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  refreshTokenStore.delete(hash);
};

const hashPassword = (plain) => bcrypt.hash(plain, 12);

module.exports = { login, refresh, logout, hashPassword };
