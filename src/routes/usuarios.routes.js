const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authJWT = require('../middlewares/authJWT');
const verifyRole = require('../middlewares/verifyRole');
const validators = require('../validators');
const auditLog = require('../middlewares/auditLog');

router.get('/', authJWT, verifyRole('dueno', 'administrador'), usuarioController.listar);
router.post('/', authJWT, verifyRole('dueno', 'administrador'), validators.usuarioCrear, auditLog('usuarios'), usuarioController.crear);
router.put('/:id', authJWT, verifyRole('dueno', 'administrador'), validators.usuarioActualizar, auditLog('usuarios'), usuarioController.actualizar);
router.delete('/:id', authJWT, verifyRole('dueno', 'administrador'), validators.usuarioDesactivar, auditLog('usuarios'), usuarioController.desactivar);

module.exports = router;
