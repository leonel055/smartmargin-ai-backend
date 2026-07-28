'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar unique compuesto (empresaId, nombre) a zonas
    await queryInterface.addIndex('zonas', ['empresaId', 'nombre'], {
      unique: true,
      name: 'unique_empresa_nombre',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('zonas', 'unique_empresa_nombre');
  },
};
