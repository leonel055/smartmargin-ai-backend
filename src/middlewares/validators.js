const { body, param, validationResult } = require("express-validator");

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validacion",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const registerValidator = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio").trim(),
  body("apellido").notEmpty().withMessage("El apellido es obligatorio").trim(),
  body("email").isEmail().withMessage("Email invalido").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contrasena debe tener al menos 6 caracteres"),
  body("rol")
    .isIn(["dueno", "administrador", "gerente", "empleado"])
    .withMessage("Rol invalido"),
  handleValidationErrors,
];

const loginValidator = [
  body("email").isEmail().withMessage("Email invalido").normalizeEmail(),
  body("password").notEmpty().withMessage("La contrasena es obligatoria"),
  handleValidationErrors,
];

const crearUsuarioValidator = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio").trim(),
  body("apellido").notEmpty().withMessage("El apellido es obligatorio").trim(),
  body("email").isEmail().withMessage("Email invalido").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contrasena debe tener al menos 6 caracteres"),
  body("rol")
    .optional()
    .isIn(["dueno", "gerente", "empleado"])
    .withMessage("Rol invalido"),
  handleValidationErrors,
];

const actualizarUsuarioValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("apellido").optional().notEmpty().withMessage("El apellido no puede estar vacio").trim(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Email invalido")
    .normalizeEmail(),
  body("rol")
    .optional()
    .isIn(["dueno", "gerente", "empleado"])
    .withMessage("Rol invalido"),
  handleValidationErrors,
];

const crearTransaccionValidator = [
  body("tipo").isIn(["venta", "compra"]).withMessage("El tipo debe ser venta o compra"),
  body("cantidad")
    .isFloat({ min: 1 })
    .withMessage("La cantidad debe ser un numero positivo"),
  body("precioUnitario")
    .isFloat({ min: 0.01 })
    .withMessage("El precio unitario debe ser un numero positivo"),
  body("productoId").isInt({ min: 1 }).withMessage("productoId invalido"),
  body("sucursalId").isInt({ min: 1 }).withMessage("sucursalId invalido"),
  handleValidationErrors,
];

const actualizarTransaccionValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("tipo")
    .optional()
    .isIn(["venta", "compra"])
    .withMessage("El tipo debe ser venta o compra"),
  body("cantidad")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("La cantidad debe ser un numero positivo"),
  body("precioUnitario")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("El precio unitario debe ser un numero positivo"),
  body("productoId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("productoId invalido"),
  body("sucursalId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sucursalId invalido"),
  handleValidationErrors,
];

const generarCodigoValidator = [
  body("rol")
    .isIn(["administrador", "gerente", "empleado"])
    .withMessage("El rol debe ser administrador, gerente o empleado"),
  body("usosMaximos")
    .optional()
    .isInt({ min: 1 })
    .withMessage("usosMaximos debe ser un entero positivo"),
  body("sucursalId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("sucursalId invalido"),
  body("zonaId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("zonaId invalido"),
  handleValidationErrors,
];

const crearProductoValidator = [
  body("nombre").notEmpty().withMessage("El nombre del producto es obligatorio").trim(),
  body("codigo").notEmpty().withMessage("El codigo del producto es obligatorio").trim(),
  body("precioCompra")
    .isFloat({ min: 0.01 })
    .withMessage("El precio de compra debe ser un numero positivo"),
  body("unidadMedida")
    .optional()
    .isString()
    .withMessage("La unidad de medida debe ser texto"),
  handleValidationErrors,
];

const actualizarProductoValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("nombre").optional().notEmpty().withMessage("El nombre del producto no puede estar vacio").trim(),
  body("codigo").optional().notEmpty().withMessage("El codigo del producto no puede estar vacio").trim(),
  body("precioCompra")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("El precio de compra debe ser un numero positivo"),
  body("unidadMedida")
    .optional()
    .isString()
    .withMessage("La unidad de medida debe ser texto"),
  handleValidationErrors,
];

const crearGastoValidator = [
  body("tipo").notEmpty().withMessage("El tipo de gasto es obligatorio").trim(),
  body("monto")
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un numero positivo"),
  body("sucursalId")
    .isInt({ min: 1 })
    .withMessage("La sucursal es obligatoria"),
  body("proveedorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El proveedorId es invalido"),
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe ser valida"),
  handleValidationErrors,
];

const actualizarGastoValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("tipo").optional().notEmpty().withMessage("El tipo de gasto no puede estar vacio").trim(),
  body("monto")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un numero positivo"),
  body("sucursalId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La sucursal es invalida"),
  body("proveedorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El proveedorId es invalido"),
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe ser valida"),
  handleValidationErrors,
];

const crearInventarioValidator = [
  body("productoId").isInt({ min: 1 }).withMessage("El producto es obligatorio"),
  body("sucursalId").isInt({ min: 1 }).withMessage("La sucursal es obligatoria"),
  body("stockActual")
    .isInt({ min: 0 })
    .withMessage("El stock actual debe ser un numero entero >= 0"),
  body("stockMinimo")
    .isInt({ min: 0 })
    .withMessage("El stock minimo debe ser un numero entero >= 0"),
  body("precioVenta")
    .isFloat({ min: 0.01 })
    .withMessage("El precio de venta debe ser un numero positivo"),
  body("stockMaximo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock maximo debe ser un numero entero >= 0"),
  handleValidationErrors,
];

const actualizarInventarioValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("stockActual")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock actual debe ser un numero entero >= 0"),
  body("stockMinimo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock minimo debe ser un numero entero >= 0"),
  body("stockMaximo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock maximo debe ser un numero entero >= 0"),
  body("precioVenta")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("El precio de venta debe ser un numero positivo"),
  handleValidationErrors,
];

const crearProveedorValidator = [
  body("nombre").notEmpty().withMessage("El nombre del proveedor es obligatorio").trim(),
  body("cuit").notEmpty().withMessage("El CUIT es obligatorio").trim(),
  body("contacto").optional().isString().withMessage("El contacto debe ser texto"),
  handleValidationErrors,
];

const actualizarProveedorValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("nombre").optional().notEmpty().withMessage("El nombre del proveedor no puede estar vacio").trim(),
  body("cuit").optional().notEmpty().withMessage("El CUIT no puede estar vacio").trim(),
  body("contacto").optional().isString().withMessage("El contacto debe ser texto"),
  handleValidationErrors,
];

const crearSucursalValidator = [
  body("nombre").notEmpty().withMessage("El nombre de la sucursal es obligatorio").trim(),
  body("zonaId").isInt({ min: 1 }).withMessage("La zona es obligatoria"),
  body("direccion").optional().isString().withMessage("La direccion debe ser texto"),
  body("lat").optional().isFloat().withMessage("La latitud debe ser numerica"),
  body("lng").optional().isFloat().withMessage("La longitud debe ser numerica"),
  body("telefono").optional().isString().withMessage("El telefono debe ser texto"),
  body("gerentesMax").optional().isInt({ min: 0 }).withMessage("gerentesMax debe ser un entero >= 0"),
  body("empleadosMax").optional().isInt({ min: 0 }).withMessage("empleadosMax debe ser un entero >= 0"),
  handleValidationErrors,
];

const actualizarSucursalValidator = [
  param("id").isInt({ min: 1 }).withMessage("ID invalido"),
  body("nombre").optional().notEmpty().withMessage("El nombre de la sucursal no puede estar vacio").trim(),
  body("zonaId").optional().isInt({ min: 1 }).withMessage("La zona es invalida"),
  body("direccion").optional().isString().withMessage("La direccion debe ser texto"),
  body("lat").optional().isFloat().withMessage("La latitud debe ser numerica"),
  body("lng").optional().isFloat().withMessage("La longitud debe ser numerica"),
  body("telefono").optional().isString().withMessage("El telefono debe ser texto"),
  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  crearUsuarioValidator,
  actualizarUsuarioValidator,
  crearTransaccionValidator,
  actualizarTransaccionValidator,
  generarCodigoValidator,
  crearProductoValidator,
  actualizarProductoValidator,
  crearGastoValidator,
  actualizarGastoValidator,
  crearInventarioValidator,
  actualizarInventarioValidator,
  crearProveedorValidator,
  actualizarProveedorValidator,
  crearSucursalValidator,
  actualizarSucursalValidator,
};
