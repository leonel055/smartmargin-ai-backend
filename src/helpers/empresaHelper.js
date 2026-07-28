function resolverEmpresaId(usuario) {
  if (usuario.rol === 'dueno') return usuario.id;
  return usuario.empresaId;
}

module.exports = { resolverEmpresaId };
