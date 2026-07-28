const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Zona = sequelize.define(
    "Zona",
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      empresaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "zonas",
      timestamps: true,
    },
  );
  return Zona;
};
