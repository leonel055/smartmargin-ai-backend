require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./src/config/database");
const csrfMiddleware = require("./src/middlewares/csrf");

// Sentry - Monitoreo de errores en producción
const Sentry = require("@sentry/node");
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Modulos para documentacion Swagger
const swaggerUi = require("swagger-ui-express");
let swaggerFile;

// Intenta leer el JSON para evitar caidas si aun no se genera
try {
  swaggerFile = require("./swagger_output.json");
} catch (error) {
  swaggerFile = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:4200', 'https://smartmarginia.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', csrfMiddleware);

// Sentry request handler (debe ir después de express.json y antes de las rutas)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken || req.cookies?.['XSRF-TOKEN'] || null });
});

// Configuracion de ruta para visualizacion de Swagger UI
if (swaggerFile) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
} else {
  console.log(
    "⚠️  Aviso: Ejecuta 'npm run swagger' para inicializar el archivo swagger_output.json",
  );
}

// Rutas
const authRoutes = require("./src/routes/auth.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");
const zonasRoutes = require("./src/routes/zonas.routes");
const sucursalesRoutes = require("./src/routes/sucursales.routes");
const productosRoutes = require("./src/routes/productos.routes");
const inventarioRoutes = require("./src/routes/inventario.routes");
const transaccionesRoutes = require("./src/routes/transacciones.routes");
const gastosRoutes = require("./src/routes/gastos.routes");
const proveedoresRoutes = require("./src/routes/proveedores.routes");
const reportesRoutes = require("./src/routes/reportes.routes");
const codigosRoutes = require("./src/routes/codigos.routes");
const pagoRoutes = require("./src/routes/pago.routes");
const dolarRoutes = require("./src/routes/dolar.routes");
const auditoriaRoutes = require("./src/routes/auditoria.routes");
const suscripcionesRoutes = require("./src/routes/suscripciones.routes");
const mpRoutes = require("./src/routes/mp.routes");
const adminRoutes = require("./src/routes/admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/zonas", zonasRoutes);
app.use("/api/sucursales", sucursalesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/transacciones", transaccionesRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/codigos", codigosRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/dolar", dolarRoutes);
app.use("/api/auditoria", auditoriaRoutes);
app.use("/api/suscripciones", suscripcionesRoutes);
app.use("/api/mp", mpRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "SmartMargin API v1.0" });
});

// Sentry error handler (debe ir después de todas las rutas)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
    if (swaggerFile) {
      console.log(
        `Documentacion Swagger UI activa en: http://localhost:${PORT}/api-docs`,
      );
    }
  });
};

start();
