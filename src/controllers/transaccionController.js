const { Op } = require('sequelize');
const { Transaccion, Inventario, Usuario, Sucursal, Zona } = require('../models');
const { resolverEmpresaId } = require('../helpers/empresaHelper');

const transaccionController = {
  // GET /api/transacciones
  listar: async (req, res) => {
    try {
      const { fechaDesde, fechaHasta, sucursalId, tipo } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;
      const usuario = await Usuario.findByPk(req.usuario.id);
      const empresaId = resolverEmpresaId(usuario);

      const where = {};

      if (fechaDesde || fechaHasta) {
        where.fecha = {};
        if (fechaDesde) where.fecha[Op.gte] = new Date(fechaDesde);
        if (fechaHasta) where.fecha[Op.lte] = new Date(fechaHasta);
      }
      if (tipo) where.tipo = tipo;

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

      // Si se pasa sucursalId explícito, validar que esté dentro de las permitidas
      if (sucursalId) {
        if (Array.isArray(where.sucursalId?.[Op.in])) {
          if (!where.sucursalId[Op.in].includes(parseInt(sucursalId))) {
            return res.status(403).json({ success: false, message: 'No tenés acceso a esa sucursal' });
          }
        }
        where.sucursalId = parseInt(sucursalId, 10);
      }

      const { count: total, rows: data } = await Transaccion.findAndCountAll({
        where,
        include: [
          { association: 'producto', attributes: ['id', 'nombre', 'codigo'] },
          { association: 'usuario', attributes: ['id', 'nombre'] },
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
        message: 'Error al listar transacciones: ' + error.message,
      });
    }
  },

  // POST /api/transacciones
  crear: async (req, res) => {
    try {
      const { tipo, cantidad, precioUnitario, productoId, sucursalId, fecha, observaciones } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      if (!tipo || !['venta', 'compra'].includes(tipo)) {
        return res.status(400).json({ success: false, message: 'El tipo debe ser venta o compra' });
      }
      if (!cantidad || Number(cantidad) <= 0) {
        return res.status(400).json({ success: false, message: 'La cantidad debe ser un numero positivo' });
      }
      if (!precioUnitario || Number(precioUnitario) <= 0) {
        return res.status(400).json({ success: false, message: 'El precio unitario debe ser un numero positivo' });
      }
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

      const inventario = await Inventario.findOne({
        where: { productoId, sucursalId },
      });
      if (!inventario) {
        return res.status(400).json({
          success: false,
          message: 'El producto no tiene inventario registrado en esta sucursal',
        });
      }

      const cantidadNum = parseInt(cantidad, 10);
      const total = (Number(precioUnitario) * cantidadNum).toFixed(2);

      if (tipo === 'venta') {
        if (inventario.stockActual < cantidadNum) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente. Disponible: ${inventario.stockActual}, requerido: ${cantidadNum}`,
          });
        }
        await inventario.update({ stockActual: inventario.stockActual - cantidadNum });
      } else {
        await inventario.update({ stockActual: inventario.stockActual + cantidadNum });
      }

      const transaccion = await Transaccion.create({
        tipo,
        cantidad: cantidadNum,
        precioUnitario,
        total,
        productoId,
        sucursalId,
        usuarioId: req.usuario.id,
        fecha: fecha || new Date(),
        observaciones: observaciones || null,
      });

      res.status(201).json({
        success: true,
        data: transaccion,
        message: 'Transaccion registrada exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al registrar transaccion: ' + error.message,
      });
    }
  },

  // PUT /api/transacciones/:id
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo, cantidad, precioUnitario, productoId, sucursalId, fecha, observaciones } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      const transaccion = await Transaccion.findByPk(id, {
        include: [{
          model: Sucursal, as: 'sucursal',
          include: [{ model: Zona, as: 'zona', where: { empresaId } }],
        }],
      });
      if (!transaccion) {
        return res.status(404).json({ success: false, message: 'Transaccion no encontrada' });
      }

      const nuevaCantidad = cantidad !== undefined ? parseInt(cantidad, 10) : transaccion.cantidad;
      const nuevaTipo = tipo || transaccion.tipo;
      const nuevoPrecio = precioUnitario !== undefined ? Number(precioUnitario) : Number(transaccion.precioUnitario);
      const nuevoProductoId = productoId || transaccion.productoId;
      const nuevaSucursalId = sucursalId || transaccion.sucursalId;

      // Revertir efecto anterior en inventario
      const inventarioViejo = await Inventario.findOne({
        where: { productoId: transaccion.productoId, sucursalId: transaccion.sucursalId },
      });
      if (inventarioViejo) {
        if (transaccion.tipo === 'venta') {
          await inventarioViejo.update({ stockActual: inventarioViejo.stockActual + transaccion.cantidad });
        } else {
          await inventarioViejo.update({ stockActual: inventarioViejo.stockActual - transaccion.cantidad });
        }
      }

      // Aplicar nuevo efecto
      const inventarioNuevo = await Inventario.findOne({
        where: { productoId: nuevoProductoId, sucursalId: nuevaSucursalId },
      });
      if (!inventarioNuevo) {
        return res.status(400).json({
          success: false,
          message: 'El producto no tiene inventario registrado en esta sucursal',
        });
      }

      if (nuevaTipo === 'venta') {
        if (inventarioNuevo.stockActual < nuevaCantidad) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente. Disponible: ${inventarioNuevo.stockActual}, requerido: ${nuevaCantidad}`,
          });
        }
        await inventarioNuevo.update({ stockActual: inventarioNuevo.stockActual - nuevaCantidad });
      } else {
        await inventarioNuevo.update({ stockActual: inventarioNuevo.stockActual + nuevaCantidad });
      }

      const total = (nuevoPrecio * nuevaCantidad).toFixed(2);

      await transaccion.update({
        tipo: nuevaTipo,
        cantidad: nuevaCantidad,
        precioUnitario: nuevoPrecio,
        total,
        productoId: nuevoProductoId,
        sucursalId: nuevaSucursalId,
        fecha: fecha || transaccion.fecha,
        observaciones: observaciones !== undefined ? observaciones : transaccion.observaciones,
      });

      res.json({
        success: true,
        data: transaccion,
        message: 'Transaccion actualizada exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar transaccion: ' + error.message,
      });
    }
  },

  // DELETE /api/transacciones/:id
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = resolverEmpresaId(req.usuario);

      const transaccion = await Transaccion.findByPk(id, {
        include: [{
          model: Sucursal, as: 'sucursal',
          include: [{ model: Zona, as: 'zona', where: { empresaId } }],
        }],
      });
      if (!transaccion) {
        return res.status(404).json({ success: false, message: 'Transaccion no encontrada' });
      }

      const inventario = await Inventario.findOne({
        where: { productoId: transaccion.productoId, sucursalId: transaccion.sucursalId },
      });
      if (inventario) {
        if (transaccion.tipo === 'venta') {
          await inventario.update({ stockActual: inventario.stockActual + transaccion.cantidad });
        } else {
          await inventario.update({ stockActual: inventario.stockActual - transaccion.cantidad });
        }
      }

      await transaccion.destroy();

      res.json({
        success: true,
        data: { id: parseInt(id) },
        message: 'Transaccion anulada exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al anular transaccion: ' + error.message,
      });
    }
  },
};

module.exports = transaccionController;
