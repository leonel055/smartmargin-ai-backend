const { Op } = require('sequelize');
const { Inventario, Producto, Usuario, Sucursal, Zona, sequelize } = require('../models');
const { resolverEmpresaId } = require('../helpers/empresaHelper');

const inventarioController = {
  // GET /api/inventario
  listar: async (req, res) => {
    try {
      const { stockCritico } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;
      const usuario = await Usuario.findByPk(req.usuario.id);
      const empresaId = resolverEmpresaId(usuario);

      let where = {};

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
        const sucursales = await Sucursal.findAll({ where: whereSuc, attributes: ['id'] });
        const sucursalIds = sucursales.map(s => s.id);
        where.sucursalId = { [Op.in]: sucursalIds };
      } else {
        where.sucursalId = usuario.sucursalId;
      }

      if (stockCritico === 'true') {
        where[Op.and] = sequelize.where(
          sequelize.col('stockActual'),
          '<',
          sequelize.col('stockMinimo'),
        );
      }

      const { count: total, rows: data } = await Inventario.findAndCountAll({
        where,
        include: [
          { association: 'producto', attributes: ['id', 'nombre', 'codigo', 'precioCompra'] },
          { association: 'sucursal', attributes: ['id', 'nombre'] },
        ],
        offset,
        limit,
        order: [['id', 'ASC']],
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
        message: 'Error al listar inventario: ' + error.message,
      });
    }
  },

  // POST /api/inventario
  crear: async (req, res) => {
    try {
      const { productoId, sucursalId, stockActual, stockMinimo, stockMaximo, precioVenta } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      if (!productoId) {
        return res.status(400).json({ success: false, message: 'El producto es obligatorio' });
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

      if (stockActual === undefined || stockActual === null || Number(stockActual) < 0) {
        return res.status(400).json({ success: false, message: 'El stock actual debe ser un numero entero >= 0' });
      }
      if (stockMinimo === undefined || stockMinimo === null || Number(stockMinimo) < 0) {
        return res.status(400).json({ success: false, message: 'El stock minimo debe ser un numero entero >= 0' });
      }
      if (precioVenta === undefined || precioVenta === null || Number(precioVenta) <= 0) {
        return res.status(400).json({ success: false, message: 'El precio de venta debe ser un numero positivo' });
      }

      const existente = await Inventario.findOne({
        where: { productoId, sucursalId },
      });
      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'El producto ya esta registrado en el inventario de esta sucursal',
        });
      }

      const inventario = await Inventario.create({
        productoId,
        sucursalId,
        stockActual: parseInt(stockActual, 10),
        stockMinimo: parseInt(stockMinimo, 10),
        stockMaximo: stockMaximo !== undefined ? parseInt(stockMaximo, 10) : null,
        precioVenta,
      });

      res.status(201).json({
        success: true,
        data: inventario,
        message: 'Inventario creado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear inventario: ' + error.message,
      });
    }
  },

  // PUT /api/inventario/:id
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { stockActual, stockMinimo, stockMaximo, precioVenta } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      const inventario = await Inventario.findByPk(id, {
        include: [{
          model: Sucursal, as: 'sucursal',
          include: [{ model: Zona, as: 'zona', where: { empresaId } }],
        }],
      });
      if (!inventario) {
        return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
      }

      if (stockActual !== undefined && Number(stockActual) < 0) {
        return res.status(400).json({ success: false, message: 'El stock actual debe ser un numero entero >= 0' });
      }
      if (stockMinimo !== undefined && Number(stockMinimo) < 0) {
        return res.status(400).json({ success: false, message: 'El stock minimo debe ser un numero entero >= 0' });
      }
      if (precioVenta !== undefined && Number(precioVenta) <= 0) {
        return res.status(400).json({ success: false, message: 'El precio de venta debe ser un numero positivo' });
      }

      await inventario.update({
        stockActual: stockActual !== undefined ? parseInt(stockActual, 10) : inventario.stockActual,
        stockMinimo: stockMinimo !== undefined ? parseInt(stockMinimo, 10) : inventario.stockMinimo,
        stockMaximo: stockMaximo !== undefined ? parseInt(stockMaximo, 10) : inventario.stockMaximo,
        precioVenta: precioVenta !== undefined ? precioVenta : inventario.precioVenta,
      });

      res.json({
        success: true,
        data: inventario,
        message: 'Inventario actualizado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar inventario: ' + error.message,
      });
    }
  },

  // DELETE /api/inventario/:id
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = resolverEmpresaId(req.usuario);

      const inventario = await Inventario.findByPk(id, {
        include: [{
          model: Sucursal, as: 'sucursal',
          include: [{ model: Zona, as: 'zona', where: { empresaId } }],
        }],
      });
      if (!inventario) {
        return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
      }

      await inventario.destroy();

      res.json({
        success: true,
        data: { id: parseInt(id) },
        message: 'Inventario eliminado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar inventario: ' + error.message,
      });
    }
  },
};

module.exports = inventarioController;
