const { Op } = require('sequelize');
const { Gasto, Usuario, Sucursal, Zona } = require('../models');
const { resolverEmpresaId } = require('../helpers/empresaHelper');

const gastoController = {
  // GET /api/gastos
  listar: async (req, res) => {
    try {
      const { sucursalId, proveedorId, tipo, fecha, fechaDesde, fechaHasta } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;
      const usuario = await Usuario.findByPk(req.usuario.id);
      const empresaId = resolverEmpresaId(usuario);

      const where = {};

      if (proveedorId) where.proveedorId = parseInt(proveedorId, 10);
      if (tipo) where.tipo = tipo;

      if (fechaDesde || fechaHasta) {
        where.fecha = {};
        if (fechaDesde) where.fecha[Op.gte] = new Date(fechaDesde);
        if (fechaHasta) where.fecha[Op.lte] = new Date(fechaHasta);
      } else if (fecha) {
        where.fecha = new Date(fecha);
      }

      // Filtrar por empresa según rol
      if (usuario.rol === 'dueno' || usuario.rol === 'administrador') {
        const sucursales = await Sucursal.findAll({
          include: [{ model: Zona, as: 'zona', where: { empresaId }, attributes: [] }],
          attributes: ['id'],
        });
        const sucursalIds = sucursales.map(s => s.id);
        where.sucursalId = { [Op.in]: sucursalIds };
      } else if (usuario.rol === 'gerente') {
        const whereSuc = usuario.zonaId
          ? { zonaId: usuario.zonaId }
          : { id: usuario.sucursalId };
        const sucursales = await Sucursal.findAll({
          where: whereSuc,
          attributes: ['id'],
        });
        const sucursalIds = sucursales.map(s => s.id);
        where.sucursalId = { [Op.in]: sucursalIds };
      } else {
        where.sucursalId = usuario.sucursalId;
      }

      // Si se pasa sucursalId explícito, validar acceso
      if (sucursalId) {
        if (Array.isArray(where.sucursalId?.[Op.in])) {
          if (!where.sucursalId[Op.in].includes(parseInt(sucursalId))) {
            return res.status(403).json({ success: false, message: 'No tenés acceso a esa sucursal' });
          }
        }
        where.sucursalId = parseInt(sucursalId, 10);
      }

      const { count: total, rows: data } = await Gasto.findAndCountAll({
        where,
        include: [
          { association: 'proveedor', attributes: ['id', 'nombre', 'cuit'] },
          { association: 'sucursal', attributes: ['id', 'nombre'] },
        ],
        offset,
        limit,
        order: [['fecha', 'DESC']],
      });

      res.json({
        success: true,
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al listar gastos: ' + error.message,
      });
    }
  },

  // POST /api/gastos
  crear: async (req, res) => {
    try {
      const { tipo, monto, descripcion, fecha, proveedorId, sucursalId } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      if (!tipo || !tipo.trim()) {
        return res.status(400).json({ success: false, message: 'El tipo de gasto es obligatorio' });
      }
      if (monto === undefined || monto === null || Number(monto) <= 0) {
        return res.status(400).json({ success: false, message: 'El monto debe ser un numero positivo' });
      }
      if (!sucursalId) {
        return res.status(400).json({ success: false, message: 'La sucursal es obligatoria' });
      }

      // Validar que la sucursal pertenece a la empresa
      const sucursal = await Sucursal.findOne({
        where: { id: sucursalId },
        include: [{ model: Zona, as: 'zona', where: { empresaId } }],
      });
      if (!sucursal) {
        return res.status(400).json({ success: false, message: 'La sucursal no pertenece a tu empresa' });
      }

      const gasto = await Gasto.create({
        tipo: tipo.trim(),
        monto,
        descripcion: descripcion || null,
        fecha: fecha || new Date(),
        proveedorId: proveedorId || null,
        sucursalId,
      });

      res.status(201).json({
        success: true,
        data: gasto,
        message: 'Gasto registrado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al registrar gasto: ' + error.message,
      });
    }
  },

  // PUT /api/gastos/:id
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo, monto, descripcion, fecha, proveedorId, sucursalId } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      const gasto = await Gasto.findByPk(id, {
        include: [{
          model: Sucursal, as: 'sucursal',
          include: [{ model: Zona, as: 'zona', where: { empresaId } }],
        }],
      });
      if (!gasto) {
        return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      }

      await gasto.update({
        tipo: tipo !== undefined ? tipo : gasto.tipo,
        monto: monto !== undefined ? monto : gasto.monto,
        descripcion: descripcion !== undefined ? descripcion : gasto.descripcion,
        fecha: fecha !== undefined ? fecha : gasto.fecha,
        proveedorId: proveedorId !== undefined ? proveedorId : gasto.proveedorId,
        sucursalId: sucursalId !== undefined ? sucursalId : gasto.sucursalId,
      });

      res.json({
        success: true,
        data: gasto,
        message: 'Gasto actualizado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar gasto: ' + error.message,
      });
    }
  },

  // DELETE /api/gastos/:id
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = resolverEmpresaId(req.usuario);

      const gasto = await Gasto.findByPk(id, {
        include: [{
          model: Sucursal, as: 'sucursal',
          include: [{ model: Zona, as: 'zona', where: { empresaId } }],
        }],
      });
      if (!gasto) {
        return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      }

      await gasto.destroy();

      res.json({
        success: true,
        data: { id: parseInt(id) },
        message: 'Gasto eliminado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar gasto: ' + error.message,
      });
    }
  },
};

module.exports = gastoController;
