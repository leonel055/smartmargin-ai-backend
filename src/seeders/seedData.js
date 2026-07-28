const {
  Zona, Sucursal, Producto, Inventario, Transaccion, Gasto,
  Proveedor, CodigoInvitacion, Auditoria, ReporteAgente, Suscripcion,
} = require('../models');

const seedData = async (empresaId, usuarioId) => {
  // ─── 1. ZONAS ───
  const zonas = await Zona.bulkCreate([
    { nombre: 'Zona Ramal (Origen)', empresaId },
    { nombre: 'Zona Centro (Distribución)', empresaId },
    { nombre: 'Zona Atlántica (Exportación)', empresaId },
  ]);

  // ─── 2. SUCURSALES ───
  const sucursales = await Sucursal.bulkCreate([
    { nombre: 'Planta Industrial Ledesma', direccion: 'Av. Wollmann s/n, Libertador Gral. San Martín, Jujuy', lat: -23.804, lng: -64.792, telefono: '0388-4221000', zonaId: zonas[0].id },
    { nombre: 'Centro Logístico Tronador', direccion: 'Tronador 2300, San Justo, Buenos Aires', lat: -34.681, lng: -58.552, telefono: '011-4444-5555', zonaId: zonas[1].id },
    { nombre: 'Terminal de Embarque Rosario', direccion: 'Av. Belgrano 2100, Puerto Rosario, Santa Fe', lat: -32.959, lng: -60.627, telefono: '0341-4223344', zonaId: zonas[2].id },
    { nombre: 'Depósito Perico', direccion: 'Ruta 34 Km 1200, Perico, Jujuy', lat: -24.382, lng: -65.113, telefono: '0388-4987654', zonaId: zonas[0].id },
    { nombre: 'Punto de Venta Palpalá', direccion: 'Av. del Trabajo 500, Palpalá, Jujuy', lat: -24.256, lng: -65.211, telefono: '0388-4278901', zonaId: zonas[0].id },
  ]);

  // ─── 3. PROVEEDORES ───
  const proveedores = await Proveedor.bulkCreate([
    { nombre: 'Maquinarias Agrícolas del Norte S.A.', cuit: '30-55443322-9', contacto: 'ventas@maquinorte.com' },
    { nombre: 'Química Industrial NOA', cuit: '30-77665544-8', contacto: 'insumos@quimicanoa.com' },
    { nombre: 'Papelera del Plata Insumos', cuit: '30-11223344-5', contacto: 'insumos@papeleradelplata.com' },
    { nombre: 'Logística y Transportes Pampero', cuit: '30-99887766-4', contacto: 'viajes@pamperolog.com' },
    { nombre: 'Citrícola del Norte', cuit: '30-88776655-3', contacto: 'cosecha@citricolanorte.com' },
    { nombre: 'Envases y Embalajes NOA', cuit: '30-66554433-2', contacto: 'ventas@envasesnoa.com' },
    { nombre: 'Combustibles del Sur', cuit: '30-44332211-1', contacto: 'distribucion@combustiblesur.com' },
    { nombre: 'Servicios Informáticos Jujuy', cuit: '30-22113344-7', contacto: 'soporte@sisju.com' },
  ]);

  // ─── 4. PRODUCTOS (catálogo Ingenio Ledesma) ───
  const prodData = [
    { nombre: 'Azúcar Ledesma Clásica 1kg', codigo: 'AZU-CLA-001', categoria: 'Azúcares', precioCompra: 450, unidadMedida: 'Kg' },
    { nombre: 'Azúcar Ledesma Rubio 500g', codigo: 'AZU-RUB-002', categoria: 'Azúcares', precioCompra: 600, unidadMedida: 'Unidad' },
    { nombre: 'Azúcar Chango Impalpable 250g', codigo: 'AZU-CHA-003', categoria: 'Azúcares', precioCompra: 350, unidadMedida: 'Unidad' },
    { nombre: 'Papel Autor A4 75gr (Resma x500)', codigo: 'PAP-AUT-A4', categoria: 'Papel', precioCompra: 3200, unidadMedida: 'Resma' },
    { nombre: 'Papel Ledesma Nat Reciclado A4', codigo: 'PAP-NAT-A4', categoria: 'Papel', precioCompra: 3500, unidadMedida: 'Resma' },
    { nombre: 'Repuesto Escolar Ledesma 96 Hojas', codigo: 'LIB-REP-096', categoria: 'Librería', precioCompra: 1200, unidadMedida: 'Unidad' },
    { nombre: 'Cuaderno Universitario Éxito 80H', codigo: 'LIB-CUA-EXI', categoria: 'Librería', precioCompra: 1800, unidadMedida: 'Unidad' },
    { nombre: 'Alcohol Etílico 1L', codigo: 'ALC-ETI-001', categoria: 'Bioenergía', precioCompra: 800, unidadMedida: 'Litro' },
    { nombre: 'Bioetanol Ledesma Granel', codigo: 'ALC-BIO-GRA', categoria: 'Bioenergía', precioCompra: 250, unidadMedida: 'Litro' },
    { nombre: 'Naranjas Exportación (Cajón)', codigo: 'FRU-NAR-001', categoria: 'Frutas', precioCompra: 4000, unidadMedida: 'Cajón' },
    { nombre: 'Pomelos Rojos Ledesma (Cajón)', codigo: 'FRU-POM-002', categoria: 'Frutas', precioCompra: 4500, unidadMedida: 'Cajón' },
    { nombre: 'Jugo Concentrado Naranja 5L', codigo: 'FRU-JGO-003', categoria: 'Frutas', precioCompra: 2800, unidadMedida: 'Litro' },

    { nombre: 'Harina de Maíz Precocida 1kg', codigo: 'ALI-HAR-001', categoria: 'Alimentos', precioCompra: 380, unidadMedida: 'Kg' },
    { nombre: 'Aceite de Girasol 900ml', codigo: 'ALI-ACE-002', categoria: 'Alimentos', precioCompra: 650, unidadMedida: 'Unidad' },
    { nombre: 'Arroz Largo Fino 1kg', codigo: 'ALI-ARR-003', categoria: 'Alimentos', precioCompra: 420, unidadMedida: 'Kg' },
    { nombre: 'Fideos Tallarín 500g', codigo: 'ALI-FID-004', categoria: 'Alimentos', precioCompra: 250, unidadMedida: 'Unidad' },
    { nombre: 'Leche Entera 1L', codigo: 'ALI-LEC-005', categoria: 'Alimentos', precioCompra: 520, unidadMedida: 'Litro' },
    { nombre: 'Yogur Bebible Frutilla 200cc', codigo: 'ALI-YOG-006', categoria: 'Alimentos', precioCompra: 180, unidadMedida: 'Unidad' },
    { nombre: 'Galletitas Dulces 150g', codigo: 'ALI-GAL-007', categoria: 'Alimentos', precioCompra: 200, unidadMedida: 'Unidad' },

    { nombre: 'Detergente Lavavajillas 500ml', codigo: 'LIM-DET-001', categoria: 'Limpieza', precioCompra: 310, unidadMedida: 'Unidad' },
    { nombre: 'Lavandina 1L', codigo: 'LIM-LAV-002', categoria: 'Limpieza', precioCompra: 190, unidadMedida: 'Litro' },
    { nombre: 'Jabón en Polvo 400g', codigo: 'LIM-JAB-003', categoria: 'Limpieza', precioCompra: 280, unidadMedida: 'Unidad' },
    { nombre: 'Esponja Multiuso x3', codigo: 'LIM-ESP-004', categoria: 'Limpieza', precioCompra: 150, unidadMedida: 'Unidad' },

    { nombre: 'Gaseosa Cola 1.5L', codigo: 'BEB-GAS-001', categoria: 'Bebidas', precioCompra: 480, unidadMedida: 'Unidad' },
    { nombre: 'Agua Mineral 2L', codigo: 'BEB-AGU-002', categoria: 'Bebidas', precioCompra: 200, unidadMedida: 'Unidad' },
    { nombre: 'Cerveza Rubia Lata 473ml', codigo: 'BEB-CER-003', categoria: 'Bebidas', precioCompra: 350, unidadMedida: 'Unidad' },
    { nombre: 'Vino Tinto Malbec 750ml', codigo: 'BEB-VIN-004', categoria: 'Bebidas', precioCompra: 1200, unidadMedida: 'Unidad' },

    { nombre: 'Snack Papas Fritas 120g', codigo: 'SNK-PAP-001', categoria: 'Snacks', precioCompra: 220, unidadMedida: 'Unidad' },
    { nombre: 'Barrita de Cereal 30g', codigo: 'SNK-BAR-002', categoria: 'Snacks', precioCompra: 130, unidadMedida: 'Unidad' },
    { nombre: 'Maní Salado 150g', codigo: 'SNK-MAN-003', categoria: 'Snacks', precioCompra: 180, unidadMedida: 'Unidad' },

    { nombre: 'Cable USB Tipo C 1m', codigo: 'ELE-USB-001', categoria: 'Electrónica', precioCompra: 750, unidadMedida: 'Unidad' },
    { nombre: 'Auriculares Bluetooth', codigo: 'ELE-AUR-002', categoria: 'Electrónica', precioCompra: 2500, unidadMedida: 'Unidad' },
    { nombre: 'Cargador Pared 20W', codigo: 'ELE-CAR-003', categoria: 'Electrónica', precioCompra: 1800, unidadMedida: 'Unidad' },
  ];

  const productos = await Producto.bulkCreate(prodData);

  // ─── 5. INVENTARIO (producto × sucursal) ───
  const inventarioData = [];
  for (const suc of sucursales) {
    for (const prod of productos) {
      const stockAct = Math.floor(Math.random() * 500) + 50;
      inventarioData.push({
        sucursalId: suc.id,
        productoId: prod.id,
        stockActual: stockAct,
        stockMinimo: 20,
        stockMaximo: 1000,
        precioVenta: Math.round(prod.precioCompra * 1.45),
      });
    }
  }
  await Inventario.bulkCreate(inventarioData);

  // ─── 6. TRANSACCIONES (800 registros, 2020-2026) ───
  const transacciones = [];
  const inicio = new Date('2020-01-01').getTime();
  const fin = new Date('2026-03-01').getTime();

  for (let i = 0; i < 800; i++) {
    const t = inicio + Math.random() * (fin - inicio);
    const fecha = new Date(t);
    const mes = fecha.getMonth();

    const estacional = (mes >= 4 && mes <= 10) || mes === 11 ? 1.4 : 0.7;
    if (Math.random() > estacional * 0.72) continue;

    const esVenta = Math.random() < 0.7;
    const suc = sucursales[Math.floor(Math.random() * sucursales.length)];
    const prod = productos[Math.floor(Math.random() * productos.length)];
    const cant = Math.floor(Math.random() * 80) + 5;
    const pu = esVenta ? Math.round(prod.precioCompra * 1.45) : prod.precioCompra;

    transacciones.push({
      tipo: esVenta ? 'venta' : 'compra',
      fecha,
      cantidad: cant,
      precioUnitario: pu,
      total: cant * pu,
      productoId: prod.id,
      sucursalId: suc.id,
      usuarioId,
    });
  }
  await Transaccion.bulkCreate(transacciones);

  // ─── 7. GASTOS (150 registros con anomalías) ───
  const tiposGasto = ['Alquiler', 'Servicios', 'Sueldos', 'Mantenimiento', 'Impuestos'];
  const gastos = [];
  for (let i = 0; i < 150; i++) {
    const t = inicio + Math.random() * (fin - inicio);
    const fecha = new Date(t);
    const tipo = tiposGasto[Math.floor(Math.random() * tiposGasto.length)];

    let monto = Math.floor(Math.random() * 150000) + 50000;
    let anomalia = false;

    if (i % 25 === 0) {
      monto = monto * 8;
      anomalia = true;
    }

    gastos.push({
      tipo,
      monto,
      fecha,
      descripcion: `Gasto de ${tipo} - Período ${fecha.toISOString().slice(0, 7)}`,
      anomalia,
      sucursalId: sucursales[Math.floor(Math.random() * sucursales.length)].id,
      proveedorId: proveedores[Math.floor(Math.random() * proveedores.length)].id,
    });
  }
  await Gasto.bulkCreate(gastos);

  // ─── 8. CÓDIGOS DE INVITACIÓN ───
  await CodigoInvitacion.bulkCreate([
    { codigo: 'EMP-LEDE-2021', rol: 'empleado', empresaId, sucursalId: sucursales[0].id, usosMaximos: 3, usosRealizados: 3, activo: false },
    { codigo: 'EMP-LEDE-2023', rol: 'empleado', empresaId, sucursalId: sucursales[0].id, usosMaximos: 5, usosRealizados: 5, activo: false },
    { codigo: 'GER-LEDE-ZAFRA', rol: 'gerente', empresaId, sucursalId: sucursales[1].id, usosMaximos: 2, usosRealizados: 2, activo: false },
    { codigo: 'EMP-LEDE-ACTIVO', rol: 'empleado', empresaId, sucursalId: sucursales[2].id, usosMaximos: 10, usosRealizados: 2, activo: true },
    { codigo: 'GER-LEDE-ACTIVO', rol: 'gerente', empresaId, sucursalId: sucursales[1].id, usosMaximos: 5, usosRealizados: 0, activo: true },
    { codigo: 'ADM-LEDE-SEED', rol: 'administrador', empresaId, usosMaximos: 1, usosRealizados: 1, activo: false },
  ]);

  // ─── 9. AUDITORÍA ───
  const acciones = ['CREATE', 'UPDATE', 'DELETE'];
  const entidades = ['Producto', 'Inventario', 'Gasto', 'Transaccion', 'Sucursal'];
  const auditorias = [];
  for (let i = 0; i < 60; i++) {
    auditorias.push({
      accion: acciones[Math.floor(Math.random() * acciones.length)],
      entidad: entidades[Math.floor(Math.random() * entidades.length)],
      entidadId: Math.floor(Math.random() * 100) + 1,
      datosNuevos: { seed: true, timestamp: new Date() },
      usuarioId,
    });
  }
  await Auditoria.bulkCreate(auditorias);

  // ─── 10. REPORTES DE AGENTES IA ───
  await ReporteAgente.bulkCreate([
    { tipoAgente: 'central', sector: 'ventas', contenidoJSON: { eficiencia: 94, recomendacion: 'Aumentar producción de azúcar rubio' }, resumenNLP: 'Detección de estacionalidad óptima en la molienda de caña durante agosto. Se recomienda aumentar stock de Azúcar Rubio para fin de año.', generadoPor: usuarioId, sucursalId: sucursales[0].id, zonaId: zonas[0].id, fechaGeneracion: new Date('2025-08-15') },
    { tipoAgente: 'zona', sector: 'stock', contenidoJSON: { alerta: 'media', tipo: 'costo_logistico' }, resumenNLP: 'Anomalía de costos detectada en Centro Logístico Tronador debido a incremento en tarifas de flete intermunicipal.', generadoPor: usuarioId, sucursalId: sucursales[1].id, zonaId: zonas[1].id, fechaGeneracion: new Date('2025-11-20') },
    { tipoAgente: 'sector', sector: 'finanzas', contenidoJSON: { balance: 'positivo', incremento: 40 }, resumenNLP: 'Incremento del 40% en flujo de caja consolidado por liquidación de exportaciones de cítricos a la Unión Europea.', generadoPor: usuarioId, sucursalId: sucursales[2].id, zonaId: zonas[2].id, fechaGeneracion: new Date('2025-12-05') },
    { tipoAgente: 'sector', sector: 'ventas', contenidoJSON: { estacional: true, pico: 'diciembre' }, resumenNLP: 'Pico de ventas de papel y azúcar registrado en diciembre. Stock de papel Autor A4 cerca del mínimo en sucursales del ramal.', generadoPor: usuarioId, sucursalId: sucursales[0].id, zonaId: zonas[0].id, fechaGeneracion: new Date('2026-01-10') },
    { tipoAgente: 'central', sector: 'stock', contenidoJSON: { alerta: 'crítica', producto: 'Alcohol Etílico' }, resumenNLP: 'Stock de Alcohol Etílico por debajo del mínimo en 2 sucursales. Programar reposición urgente con Química Industrial NOA.', generadoPor: usuarioId, sucursalId: sucursales[3].id, zonaId: zonas[1].id, fechaGeneracion: new Date('2026-02-28') },
  ]);

  // ─── 11. SUSCRIPCIÓN (enterprise activa) ───
  await Suscripcion.create({
    plan: 'enterprise',
    estado: 'activo',
    monto: 75000.00,
    usuarioId: empresaId,
    fechaPago: new Date(),
  });

  return { totalEstimado: transacciones.length + gastos.length + inventarioData.length + 60 + 5 + 6 + 4 + 8 + 35 };
};

module.exports = { seedData };
