// Integración con Google OAuth 2.0
const { OAuth2Client } = require('google-auth-library');
const { Usuario, CodigoInvitacion } = require('../models');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const obtenerNombreCompleto = (googleData) => {
  const apellido = googleData.family_name || googleData.name?.split(' ').slice(1).join(' ') || '';
  const nombre = googleData.given_name || googleData.name?.split(' ')[0] || googleData.name || '';
  return { nombre, apellido };
};

/**
 * Valida un token de Google ID y devuelve los datos del usuario.
 */
const verificarTokenGoogle = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload(); // { sub, email, name, picture }
};

/**
 * Busca o crea un usuario a partir de los datos de Google y un código de invitación.
 */
const encontrarOCrearUsuario = async (googleData, codigoInvitacion) => {
  const { nombre, apellido } = obtenerNombreCompleto(googleData);
  const googleId = googleData.sub;
  const email = googleData.email;

  let usuario = await Usuario.findOne({ where: { googleId } });
  if (usuario) return usuario;

  usuario = await Usuario.findOne({ where: { email } });
  if (usuario) {
    if (usuario.googleId && usuario.googleId !== googleId) {
      throw new Error('El email ya está asociado a otra cuenta de Google.');
    }

    usuario.googleId = googleId;

    if (!usuario.empresaId || !usuario.sucursalId || !usuario.zonaId) {
      if (!codigoInvitacion) {
        throw new Error('Código de invitación requerido para vincular el usuario OAuth al tenant.');
      }

      const codigo = await CodigoInvitacion.findOne({
        where: { codigo: codigoInvitacion, activo: true },
      });

      if (!codigo) {
        throw new Error('Código de invitación inválido o inactivo.');
      }

      if (usuario.rol !== codigo.rol && usuario.rol !== 'dueno') {
        throw new Error('El código de invitación no coincide con el rol del usuario existente.');
      }

      usuario.empresaId = usuario.empresaId || codigo.empresaId;
      usuario.sucursalId = usuario.sucursalId || codigo.sucursalId;
      usuario.zonaId = usuario.zonaId || codigo.zonaId || null;

      codigo.usosRealizados += 1;
      if (codigo.usosRealizados >= codigo.usosMaximos) {
        codigo.activo = false;
      }
      await codigo.save();
    }

    await usuario.save();
    return usuario;
  }

  if (!codigoInvitacion) {
    throw new Error('Código de invitación requerido para crear el usuario OAuth.');
  }

  const codigo = await CodigoInvitacion.findOne({
    where: { codigo: codigoInvitacion, activo: true },
  });

  if (!codigo) {
    throw new Error('Código de invitación inválido o inactivo.');
  }

  const nuevoUsuario = await Usuario.create({
    nombre,
    apellido,
    email,
    googleId,
    password: 'google-oauth-' + googleId,
    rol: codigo.rol || 'empleado',
    empresaId: codigo.empresaId || null,
    sucursalId: codigo.sucursalId || null,
    zonaId: codigo.zonaId || null,
    activo: true,
  });

  codigo.usosRealizados += 1;
  if (codigo.usosRealizados >= codigo.usosMaximos) {
    codigo.activo = false;
  }
  await codigo.save();

  return nuevoUsuario;
};

module.exports = { verificarTokenGoogle, encontrarOCrearUsuario };
