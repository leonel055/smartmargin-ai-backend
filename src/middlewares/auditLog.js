"use strict";
const { Auditoria } = require("../models");

const auditLog = (entidad) => {
  return async (req, res, next) => {
    try {
      const usuarioId = req.usuario?.id || null;
      const method = req.method;
      let accion, datosAnteriores = null, datosNuevos = null, entidadId = null;

      if (method === "POST") {
        accion = "CREATE";
        datosNuevos = req.body;
      } else if (method === "PUT") {
        accion = "UPDATE";
        entidadId = req.params.id;
        const modelo = require(`../models/${entidad.charAt(0).toUpperCase() + entidad.slice(1)}`);
        const registro = await modelo.findByPk(entidadId);
        if (registro) {
          datosAnteriores = registro.toJSON();
        }
        datosNuevos = req.body;
      } else if (method === "DELETE") {
        accion = "DELETE";
        entidadId = req.params.id;
        const modelo = require(`../models/${entidad.charAt(0).toUpperCase() + entidad.slice(1)}`);
        const registro = await modelo.findByPk(entidadId);
        if (registro) {
          datosAnteriores = registro.toJSON();
        }
      } else {
        return next();
      }

      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          if (body && body.success && (method === "POST" || method === "PUT" || method === "DELETE")) {
            if (method === "POST" && body.data && body.data.id) {
              entidadId = body.data.id;
            }
            await Auditoria.create({
              accion,
              entidad,
              entidadId,
              datosAnteriores,
              datosNuevos,
              usuarioId,
            });
          }
        } catch (err) {
          console.error("Error al registrar auditoría:", err.message);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Error en auditLog:", error.message);
      next();
    }
  };
};

module.exports = auditLog;
