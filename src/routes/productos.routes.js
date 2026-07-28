const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const authJWT = require('../middlewares/authJWT');
const verifyRole = require('../middlewares/verifyRole');
const validators = require('../validators');
const auditLog = require('../middlewares/auditLog');

router.get('/', authJWT, verifyRole('dueno', 'administrador', 'gerente', 'empleado'), productoController.listar);
router.post('/', authJWT, verifyRole('dueno', 'administrador', 'gerente', 'empleado'), validators.productoCrear, auditLog('productos'), productoController.crear);
router.put('/:id', authJWT, verifyRole('dueno', 'administrador', 'gerente', 'empleado'), validators.productoActualizar, auditLog('productos'), productoController.actualizar);
router.delete('/:id', authJWT, verifyRole('dueno', 'administrador', 'gerente'), validators.productoEliminar, auditLog('productos'), productoController.eliminar);

module.exports = router;
