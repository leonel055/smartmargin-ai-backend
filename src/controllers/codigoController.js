const crypto = require("crypto");
const { CodigoInvitacion, Suscripcion } = require("../models");

// Helper para extraer el empresaId según quién realiza la petición
const obtenerEmpresaId = (req) => {
  if (req.usuario.rol === "dueno") return req.usuario.id;
  if (req.usuario.rol === "administrador") return req.usuario.empresaId;
  return null;
};

// Configuración de límites máximos por tipo de suscripción
const LIMITES = {
  basico: { gerentes: 3, empleados: 30 },
  pro: { gerentes: 10, empleados: 100 },
  enterprise: { gerentes: Infinity, empleados: Infinity },
};

// Generador de códigos aleatorios únicos con prefijos identificatorios
const generarCodigoAleatorio = (rol) => {
  const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
  const prefijo =
    rol === "administrador" ? "ADM" : rol === "gerente" ? "GER" : "EMP";
  return `${prefijo}-${hex}`;
};

// Listar todos los códigos pertenecientes a la empresa
const listar = async (req, res) => {
  try {
    const empresaId = obtenerEmpresaId(req);
    const codigos = await CodigoInvitacion.findAll({
      where: { empresaId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: codigos,
      message: codigos.length
        ? `${codigos.length} códigos encontrados`
        : "No hay códigos generados aún",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al listar códigos: " + error.message,
    });
  }
};

// Generar un nuevo código aplicando reglas de negocio y jerarquía V3
const generar = async (req, res) => {
  try {
    const { rol, usosMaximos, sucursalId, zonaId } = req.body;

    // 1. Validar que el rol solicitado sea uno de los tres permitidos
    if (!rol || !["administrador", "gerente", "empleado"].includes(rol)) {
      return res.status(400).json({
        success: false,
        message:
          "El rol solicitado no es válido. Debe ser 'administrador', 'gerente' o 'empleado'.",
      });
    }

    // 2. Control estricto de Jerarquía de Personal (Usa tu variable original)
    const rolSolicitante = req.usuario.rol;

    // REGLA A: El Dueño SOLO puede generar códigos para Administrador
    if (rolSolicitante === "dueno" && rol !== "administrador") {
      return res.status(403).json({
        success: false,
        message:
          "Acceso denegado: El Dueño únicamente puede generar códigos para el rol 'administrador'.",
      });
    }

    // REGLA B: El Administrador SOLO puede generar códigos para Gerente o Empleado
    if (rolSolicitante === "administrador" && rol === "administrador") {
      return res.status(403).json({
        success: false,
        message:
          "Acceso denegado: Un administrador no puede crear códigos para otro administrador. Solo el Dueño tiene ese permiso.",
      });
    }

    const empresaId = obtenerEmpresaId(req);

    // 4. Validación de topes máximos según el Plan de la Suscripción
    const suscripcion = await Suscripcion.findOne({ where: { usuarioId: empresaId } });
    const plan = suscripcion ? suscripcion.plan : "basico";
    const limitesPlan = LIMITES[plan] || LIMITES.basico;

    if (rol === "gerente" || rol === "empleado") {
      const clave = rol === "gerente" ? "gerentes" : "empleados";
      const maximoPlan = limitesPlan[clave];

      const actuales = await CodigoInvitacion.count({
        where: { empresaId, rol },
      });

      if (actuales >= maximoPlan) {
        return res.status(400).json({
          success: false,
          message: `Has alcanzado el límite de tu plan (máx ${maximoPlan} ${clave}). Actualizá a un plan superior.`,
        });
      }
    }

    // 5. Bucle de reintentos para asegurar colisión cero en los hashes
    let codigo;
    let intentos = 0;
    while (intentos < 10) {
      codigo = generarCodigoAleatorio(rol);
      const existe = await CodigoInvitacion.findOne({ where: { codigo } });
      if (!existe) break;
      intentos++;
    }

    const nuevo = await CodigoInvitacion.create({
      codigo,
      rol,
      usosMaximos: usosMaximos || 1,
      empresaId,
      sucursalId: sucursalId || null,
      zonaId: zonaId || null,
    });

    res.status(201).json({
      success: true,
      data: nuevo,
      message: `Código ${codigo} generado exitosamente para el rol ${rol}.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar código: " + error.message,
    });
  }
};

// Revocar la validez de un código de manera lógica
const revocar = async (req, res) => {
  try {
    const codigo = await CodigoInvitacion.findOne({
      where: { id: req.params.id, empresaId: obtenerEmpresaId(req) },
    });

    if (!codigo) {
      return res
        .status(404)
        .json({ success: false, message: "Código no encontrado" });
    }

    await codigo.update({ activo: false });

    res.json({
      success: true,
      data: codigo,
      message: "Código revocado exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al revocar código: " + error.message,
    });
  }
};

module.exports = {
  listar,
  generar,
  revocar,
};
