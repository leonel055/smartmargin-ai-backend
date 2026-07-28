const express = require('express');
const router = express.Router();
const zonaController = require('../controllers/zonaController');
const authJWT = require('../middlewares/authJWT');
const verifyRole = require('../middlewares/verifyRole');
const validators = require('../validators');
const auditLog = require('../middlewares/auditLog');

router.get('/', authJWT, verifyRole('dueno', 'administrador', 'gerente'), zonaController.listar);
router.post('/', authJWT, verifyRole('dueno', 'administrador'), validators.zonaCrear, auditLog('zonas'), zonaController.crear);
router.put('/:id', authJWT, verifyRole('dueno', 'administrador'), validators.zonaActualizar, auditLog('zonas'), zonaController.actualizar);
router.delete('/:id', authJWT, verifyRole('dueno', 'administrador'), validators.zonaEliminar, auditLog('zonas'), zonaController.eliminar);

module.exports = router;
