const { Sucursal, Usuario, Zona, CodigoInvitacion, Suscripcion } = require('../models');
const { resolverEmpresaId } = require('../helpers/empresaHelper');

const LIMITES = {
  basico: { sucursales: 3, gerentes: 3, empleados: 30 },
  pro: { sucursales: 10, gerentes: 10, empleados: 100 },
  enterprise: { sucursales: Infinity, gerentes: Infinity, empleados: Infinity },
};

const sucursalController = {
  // GET /api/sucursales
  listar: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.usuario.id);
      const empresaId = resolverEmpresaId(usuario);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      let result;
      if (usuario.rol === 'dueno' || usuario.rol === 'administrador') {
        result = await Sucursal.findAndCountAll({
          include: [{
            association: 'zona',
            attributes: ['id', 'nombre'],
            where: { empresaId },
          }],
          offset, limit,
          order: [['nombre', 'ASC']],
        });
      } else if (usuario.rol === 'gerente') {
        const whereGerente = usuario.zonaId
          ? { zonaId: usuario.zonaId }
          : { id: usuario.sucursalId };
        result = await Sucursal.findAndCountAll({
          where: whereGerente,
          include: [{ association: 'zona', attributes: ['id', 'nombre'] }],
          offset, limit,
          order: [['nombre', 'ASC']],
        });
      } else {
        result = await Sucursal.findAndCountAll({
          where: { id: usuario.sucursalId },
          include: [{ association: 'zona', attributes: ['id', 'nombre'] }],
          offset, limit,
        });
      }

      const { count: total, rows: data } = result;

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
        message: 'Error al listar sucursales: ' + error.message,
      });
    }
  },

  // POST /api/sucursales
  crear: async (req, res) => {
    try {
      const { nombre, direccion, lat, lng, telefono, zonaId, gerentesMax, empleadosMax } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre de la sucursal es obligatorio' });
      }

      if (!zonaId) {
        return res.status(400).json({ success: false, message: 'La zona es obligatoria' });
      }

      // Validar que la zona pertenece a la empresa
      const zona = await Zona.findOne({ where: { id: zonaId, empresaId } });
      if (!zona) {
        return res.status(400).json({ success: false, message: 'La zona no pertenece a tu empresa' });
      }

      const gerentes = gerentesMax ? parseInt(gerentesMax) : 1;
      const empleados = empleadosMax ? parseInt(empleadosMax) : 10;

      // Validar límites del plan
      const suscripcion = await Suscripcion.findOne({
        where: { usuarioId: empresaId, estado: 'activo' },
      });

      if (!suscripcion) {
        return res.status(400).json({
          success: false,
          message: 'No tenés una suscripción activa. Activá tu plan antes de crear sucursales.',
        });
      }

      const limite = LIMITES[suscripcion.plan];
      if (!limite) {
        return res.status(400).json({ success: false, message: 'Plan de suscripción no reconocido' });
      }

      // Validar cantidad de sucursales
      const sucursalesActuales = await Sucursal.count({
        include: [{ model: Zona, as: 'zona', where: { empresaId } }],
      });

      if (sucursalesActuales >= limite.sucursales) {
        return res.status(400).json({
          success: false,
          message: `Límite de sucursales alcanzado (${limite.sucursales} máx). Actualizá tu plan.`,
        });
      }

      // Validar gerentes
      const totalGerentes = await CodigoInvitacion.sum('usosMaximos', {
        where: { empresaId, rol: 'gerente', activo: true },
      }) || 0;

      if (totalGerentes + gerentes > limite.gerentes) {
        return res.status(400).json({
          success: false,
          message: `Excede el límite de gerentes (${limite.gerentes} máx). Actualizá a un plan superior.`,
        });
      }

      // Validar empleados
      const totalEmpleados = await CodigoInvitacion.sum('usosMaximos', {
        where: { empresaId, rol: 'empleado', activo: true },
      }) || 0;

      if (totalEmpleados + empleados > limite.empleados) {
        return res.status(400).json({
          success: false,
          message: `Excede el límite de empleados (${limite.empleados} máx). Actualizá a un plan superior.`,
        });
      }

      const sucursal = await Sucursal.create({
        nombre: nombre.trim(),
        direccion: direccion || null,
        lat: lat || null,
        lng: lng || null,
        telefono: telefono || null,
        zonaId,
      });

      res.status(201).json({
        success: true,
        data: sucursal,
        message: 'Sucursal creada exitosamente',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear sucursal: ' + error.message });
    }
  },

  // PUT /api/sucursales/:id
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, direccion, lat, lng, telefono, zonaId } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      // Ownership check
      const sucursal = await Sucursal.findOne({
        where: { id },
        include: [{ model: Zona, as: 'zona', where: { empresaId } }],
      });
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada',
        });
      }

      // Si cambia de zona, validar que la nueva zona pertenece a la empresa
      if (zonaId && zonaId !== sucursal.zonaId) {
        const zona = await Zona.findOne({ where: { id: zonaId, empresaId } });
        if (!zona) {
          return res.status(400).json({ success: false, message: 'La zona no pertenece a tu empresa' });
        }
      }

      await sucursal.update({
        nombre: nombre !== undefined ? nombre : sucursal.nombre,
        direccion: direccion !== undefined ? direccion : sucursal.direccion,
        lat: lat !== undefined ? lat : sucursal.lat,
        lng: lng !== undefined ? lng : sucursal.lng,
        telefono: telefono !== undefined ? telefono : sucursal.telefono,
        zonaId: zonaId !== undefined ? zonaId : sucursal.zonaId,
      });

      res.json({
        success: true,
        data: sucursal,
        message: 'Sucursal actualizada exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar sucursal: ' + error.message,
      });
    }
  },

  // DELETE /api/sucursales/:id
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = resolverEmpresaId(req.usuario);

      const sucursal = await Sucursal.findOne({
        where: { id },
        include: [{ model: Zona, as: 'zona', where: { empresaId } }],
      });
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada',
        });
      }

      await sucursal.destroy();

      res.json({
        success: true,
        data: { id: parseInt(id) },
        message: 'Sucursal eliminada exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar sucursal: ' + error.message,
      });
    }
  },
};

module.exports = sucursalController;
