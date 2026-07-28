const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const authJWT = require('../middlewares/authJWT');
const verifyRole = require('../middlewares/verifyRole');

// POST /api/pagos/crear-preferencia - Solo Dueño
router.post('/crear-preferencia', authJWT, verifyRole('dueno', 'administrador'), pagoController.crearPreferencia);

// POST /api/pagos/webhook - Público (MercadoPago)
router.post('/webhook', pagoController.manejarWebhook);

// GET /api/pagos/estado - Solo Dueño
router.get('/estado', authJWT, verifyRole('dueno', 'administrador'), pagoController.obtenerEstado);

module.exports = router;
