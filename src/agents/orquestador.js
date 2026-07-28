const { Op, col } = require('sequelize');
const agenteStock = require('./agenteStock');
const agenteVentas = require('./agenteVentas');
const agenteFinanzas = require('./agenteFinanzas');
const agenteZona = require('./agenteZona');
const agenteCentral = require('./agenteCentral');
const { Inventario, Producto, Transaccion, Gasto, Proveedor, Sucursal, Zona, sequelize } = require('../models');

const orquestador = async ({ tipo, sucursalId, zonaId, usuarioId, empresaId }) => {
  if (!empresaId) {
    throw new Error('empresaId es requerido para generar reportes.');
  }

  let resultado;
  switch (tipo) {
    case 'sector': {
      const sucursal = await Sucursal.findByPk(sucursalId, {
        include: [{ association: 'zona' }],
      });

      if (!sucursal) {
        throw new Error('Sucursal no encontrada o no pertenece a tu empresa.');
      }

      if (empresaId && sucursal.zona && sucursal.zona.empresaId !== empresaId) {
        throw new Error('Sucursal no encontrada o no pertenece a tu empresa.');
      }

      const inventario = await Inventario.findAll({
        where: { sucursalId },
        include: [{ association: 'producto', attributes: ['nombre', 'codigo', 'precioCompra'] }],
      });
      
      const datosStock = inventario.map(inv => ({
        producto: inv.producto?.nombre || 'N/A',
        stockActual: inv.stockActual,
        stockMinimo: inv.stockMinimo,
        precioCompra: inv.producto?.precioCompra || 0,
        precioVenta: inv.precioVenta,
      }));

      const transacciones = await Transaccion.findAll({
        where: { sucursalId, tipo: 'venta' },
        include: [{ association: 'producto', attributes: ['nombre'] }]
      });
      
      const datosVentas = transacciones.map(t => ({
        producto: t.producto?.nombre || 'N/A',
        cantidad: t.cantidad,
        total: parseFloat(t.total),
        fecha: t.fecha,
      }));

      const gastos = await Gasto.findAll({
        where: { sucursalId },
        include: [{ association: 'proveedor', attributes: ['nombre'] }]
      });
      
      const datosFinanzas = gastos.map(g => ({
        tipo: g.tipo,
        monto: parseFloat(g.monto),
        proveedor: g.proveedor?.nombre || 'N/A',
        fecha: g.fecha,
      }));

      resultado = {
        stock: await agenteStock.ejecutar(datosStock),
        ventas: await agenteVentas.ejecutar(datosVentas),
        finanzas: await agenteFinanzas.ejecutar(datosFinanzas),
      };
      break;
    }
    case 'zona': {
      const zona = await Zona.findOne({ where: { id: zonaId, empresaId } });
      if (!zona) {
        throw new Error('Zona no encontrada o no pertenece a tu empresa.');
      }

      const sucursales = await Sucursal.findAll({ where: { zonaId } });
      const datosZona = await Promise.all(sucursales.map(async s => {
        const ventas = await Transaccion.sum('total', { 
          where: { sucursalId: s.id, tipo: 'venta' } 
        }) || 0;
        const gastos = await Gasto.sum('monto', { 
          where: { sucursalId: s.id } 
        }) || 0;
        const stockCritico = await Inventario.count({
          where: {
            sucursalId: s.id,
            [Op.and]: sequelize.where(
              sequelize.col('stockActual'),
              '<',
              sequelize.col('stockMinimo')
            )
          }
        });
        
        return { 
          sucursal: s.nombre, 
          ventas: parseFloat(ventas), 
          gastos: parseFloat(gastos),
          stockCritico 
        };
      }));
      
      resultado = await agenteZona.ejecutar(datosZona);
      break;
    }
    case 'central': {
      const zonas = await Zona.findAll({ where: { empresaId } });
      const datosCentral = await Promise.all(zonas.map(async z => {
        const sucursales = await Sucursal.findAll({ where: { zonaId: z.id } });
        let ventas = 0, gastos = 0, stockCritico = 0;
        
        for (const s of sucursales) {
          ventas += await Transaccion.sum('total', { 
            where: { sucursalId: s.id, tipo: 'venta' } 
          }) || 0;
          gastos += await Gasto.sum('monto', { 
            where: { sucursalId: s.id } 
          }) || 0;
          stockCritico += await Inventario.count({
            where: {
              sucursalId: s.id,
              [Op.and]: sequelize.where(
                sequelize.col('stockActual'),
                '<',
                sequelize.col('stockMinimo')
              )
            }
          });
        }
        
        return { 
          zona: z.nombre, 
          ventas: parseFloat(ventas), 
          gastos: parseFloat(gastos),
          sucursales: sucursales.length,
          stockCritico 
        };
      }));
      
      resultado = await agenteCentral.ejecutar(datosCentral);
      break;
    }
    default:
      throw new Error(`Tipo de agente no válido: ${tipo}`);
  }
  return resultado;
};
module.exports = { orquestador };