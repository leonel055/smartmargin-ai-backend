const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const authJWT = require('../middlewares/authJWT');
const verifyRole = require('../middlewares/verifyRole');
const validators = require('../validators');
const auditLog = require('../middlewares/auditLog');

router.get('/', authJWT, verifyRole('dueno', 'administrador', 'gerente', 'empleado'), gastoController.listar);
router.post(
  '/',
  authJWT,
  verifyRole('dueno', 'administrador', 'gerente', 'empleado'),
  validators.gastoCrear,
  auditLog('gastos'),
  gastoController.crear,
);
router.put(
  '/:id',
  authJWT,
  verifyRole('dueno', 'administrador', 'gerente', 'empleado'),
  validators.gastoActualizar,
  auditLog('gastos'),
  gastoController.actualizar,
);
router.delete('/:id', authJWT, verifyRole('dueno', 'administrador', 'gerente'), validators.gastoEliminar, auditLog('gastos'), gastoController.eliminar);

module.exports = router;
