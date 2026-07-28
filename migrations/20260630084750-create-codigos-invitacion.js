"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("codigos_invitacion", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      codigo: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      rol: { type: Sequelize.ENUM("administrador", "gerente", "empleado"), allowNull: false },
      usosMaximos: { type: Sequelize.INTEGER, allowNull: false },
      usosRealizados: { type: Sequelize.INTEGER, defaultValue: 0 },
      activo: { type: Sequelize.BOOLEAN, defaultValue: true },
      empresaId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: "usuarios", key: "id" },
        onUpdate: "CASCADE", onDelete: "CASCADE",
      },
      sucursalId: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: "sucursales", key: "id" },
        onUpdate: "CASCADE", onDelete: "SET NULL",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("codigos_invitacion");
  },
};

