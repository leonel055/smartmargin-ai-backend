const { orquestador } = require("../agents/orquestador");
const { ReporteAgente, Usuario, Sucursal, Zona } = require("../models");
const { resolverEmpresaId } = require("../helpers/empresaHelper");

const listar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    const empresaId = resolverEmpresaId(usuario);

    // Buscar sucursales de la empresa para filtrar reportes
    const sucursales = await Sucursal.findAll({
      include: [{ model: Zona, as: 'zona', where: { empresaId }, attributes: [] }],
      attributes: ['id'],
    });
    const sucursalIds = sucursales.map(s => s.id);

    const reportes = await ReporteAgente.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { sucursalId: { [require('sequelize').Op.in]: sucursalIds } },
          { sucursalId: null },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: reportes,
      message: reportes.length
        ? `${reportes.length} reportes encontrados`
        : "No hay reportes generados aún",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al listar reportes: " + error.message,
    });
  }
};

const generar = async (req, res) => {
  try {
    const { tipo, sucursalId, zonaId } = req.body;
    if (!tipo || !["sector", "zona", "central"].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de reporte inválido. Use: sector, zona o central",
      });
    }
    if (tipo === "sector" && !sucursalId) {
      return res.status(400).json({
        success: false,
        message: "sucursalId es obligatorio para reportes de sector",
      });
    }
    if (tipo === "zona" && !zonaId) {
      return res.status(400).json({
        success: false,
        message: "zonaId es obligatorio para reportes de zona",
      });
    }
    
    const resultado = await orquestador({
      tipo,
      sucursalId,
      zonaId,
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
    });

    const reportesAProcesar = tipo === "sector" 
      ? resultado 
      : { [tipo]: resultado };

    const reportesGuardados = [];
    for (const [key, value] of Object.entries(reportesAProcesar)) {
      const reporte = await ReporteAgente.create({
        tipoAgente: tipo,
        sector: tipo === "sector" ? key : null,
        contenidoJSON: value.contenidoJSON,
        resumenNLP: value.resumenNLP,
        sucursalId: sucursalId || null,
        zonaId: zonaId || null,
        generadoPor: req.usuario.id,
      });
      reportesGuardados.push(reporte);
    }

    res.json({
      success: true,
      data: resultado,
      message: "Reporte generado y guardado exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar reporte: " + error.message,
    });
  }
};
module.exports = { listar, generar };
