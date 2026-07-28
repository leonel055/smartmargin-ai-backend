const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { resolverEmpresaId } = require('../helpers/empresaHelper');

const usuarioController = {
  // GET /api/usuarios
  listar: async (req, res) => {
    try {
      const { rol, activo, busqueda } = req.query;
      const empresaId = resolverEmpresaId(req.usuario);

      const where = { empresaId };

      if (rol) where.rol = rol;
      if (activo !== undefined) where.activo = activo === 'true';
      if (busqueda) {
        where[Op.or] = [
          { nombre: { [Op.iLike]: `%${busqueda}%` } },
          { email: { [Op.iLike]: `%${busqueda}%` } },
        ];
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count: total, rows: data } = await Usuario.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'googleId'] },
        include: [
          { association: 'zona', attributes: ['id', 'nombre'] },
          { association: 'sucursal', attributes: ['id', 'nombre'] },
        ],
        offset,
        limit,
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
        message: 'Error al listar usuarios: ' + error.message,
      });
    }
  },

  // POST /api/usuarios
  crear: async (req, res) => {
    try {
      const { nombre, apellido, email, password, rol, sector, zonaId, sucursalId } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      // Validar email único
      const existente = await Usuario.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
        });
      }

      // Validar contraseña mínima
      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      // Validar rol válido
      const rolesValidos = ['dueno', 'gerente', 'empleado', 'administrador'];
      const rolFinal = rol || 'empleado';
      if (!rolesValidos.includes(rolFinal)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido',
        });
      }

      // Si es empleado, sector y sucursalId son obligatorios
      if (rolFinal === 'empleado') {
        if (!sector) {
          return res.status(400).json({
            success: false,
            message: 'El sector es obligatorio para empleados',
          });
        }
        if (!sucursalId) {
          return res.status(400).json({
            success: false,
            message: 'La sucursal es obligatoria para empleados',
          });
        }
      }

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const usuario = await Usuario.create({
        nombre,
        apellido,
        email,
        password: hash,
        rol: rolFinal,
        sector: sector || null,
        zonaId: zonaId || null,
        sucursalId: sucursalId || null,
        empresaId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
          sector: usuario.sector,
          zonaId: usuario.zonaId,
          sucursalId: usuario.sucursalId,
          empresaId: usuario.empresaId,
        },
        message: 'Usuario creado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario: ' + error.message,
      });
    }
  },

  // PUT /api/usuarios/:id
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, email, rol, sector, zonaId, sucursalId } = req.body;
      const empresaId = resolverEmpresaId(req.usuario);

      const usuario = await Usuario.findOne({ where: { id, empresaId } });
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      // Validar email único si cambió
      if (email && email !== usuario.email) {
        const existente = await Usuario.findOne({ where: { email } });
        if (existente) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está registrado',
          });
        }
      }

      // Validar rol válido si cambió
      const rolesValidos = ['dueno', 'gerente', 'empleado', 'administrador'];
      const rolFinal = rol || usuario.rol;
      if (rol && !rolesValidos.includes(rol)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido',
        });
      }

      // Si el nuevo rol es empleado, sector y sucursalId son obligatorios
      if (rolFinal === 'empleado') {
        const sectorFinal = sector || usuario.sector;
        const sucursalFinal = sucursalId || usuario.sucursalId;
        if (!sectorFinal) {
          return res.status(400).json({
            success: false,
            message: 'El sector es obligatorio para empleados',
          });
        }
        if (!sucursalFinal) {
          return res.status(400).json({
            success: false,
            message: 'La sucursal es obligatoria para empleados',
          });
        }
      }

      await usuario.update({
        nombre: nombre || usuario.nombre,
        apellido: apellido !== undefined ? apellido : usuario.apellido,
        email: email || usuario.email,
        rol: rolFinal,
        sector: sector !== undefined ? sector : usuario.sector,
        zonaId: zonaId !== undefined ? zonaId : usuario.zonaId,
        sucursalId: sucursalId !== undefined ? sucursalId : usuario.sucursalId,
      });

      res.json({
        success: true,
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
          sector: usuario.sector,
          zonaId: usuario.zonaId,
          sucursalId: usuario.sucursalId,
          empresaId: usuario.empresaId,
        },
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario: ' + error.message,
      });
    }
  },

  // DELETE /api/usuarios/:id
  desactivar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = resolverEmpresaId(req.usuario);

      // No puede desactivarse a sí mismo
      if (req.usuario.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivarte a ti mismo',
        });
      }

      const usuario = await Usuario.findOne({ where: { id, empresaId } });
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      // Verificar que no sea el último dueño activo
      if (usuario.rol === 'dueno') {
        const duenosActivos = await Usuario.count({
          where: { empresaId, rol: 'dueno', activo: true },
        });
        if (duenosActivos <= 1) {
          return res.status(400).json({
            success: false,
            message: 'No se puede desactivar al único dueño activo de la empresa',
          });
        }
      }

      await usuario.update({ activo: false });

      res.json({
        success: true,
        data: { id: usuario.id, activo: false },
        message: 'Usuario desactivado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al desactivar usuario: ' + error.message,
      });
    }
  },
};

module.exports = usuarioController;
