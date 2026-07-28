"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("usuarios", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      empresaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      zonaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "zonas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sucursalId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "sucursales", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      apellido: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      googleId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      rol: {
        type: Sequelize.ENUM("dueno", "administrador", "gerente", "empleado"),
        defaultValue: "empleado",
      },
      sector: {
        type: Sequelize.ENUM("ventas", "finanzas", "stock"),
        allowNull: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("usuarios");
  },
};
