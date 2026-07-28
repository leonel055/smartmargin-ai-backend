const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const authJWT = require('../middlewares/authJWT');
const verifyRole = require('../middlewares/verifyRole');
const validators = require('../validators');
const auditLog = require('../middlewares/auditLog');

router.get('/', authJWT, verifyRole('dueno', 'administrador', 'gerente', 'empleado'), inventarioController.listar);
router.post(
  '/',
  authJWT,
  verifyRole('dueno', 'administrador', 'gerente', 'empleado'),
  validators.inventarioCrear,
  auditLog('inventario'),
  inventarioController.crear,
);
router.put(
  '/:id',
  authJWT,
  verifyRole('dueno', 'administrador', 'gerente', 'empleado'),
  validators.inventarioActualizar,
  auditLog('inventario'),
  inventarioController.actualizar,
);
router.delete('/:id', authJWT, verifyRole('dueno', 'administrador', 'gerente'), validators.inventarioEliminar, auditLog('inventario'), inventarioController.eliminar);

module.exports = router;
