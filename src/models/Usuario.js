const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      rol: {
        type: DataTypes.ENUM("dueno", "administrador", "gerente", "empleado"),
        defaultValue: "empleado",
      },
      sector: {
        type: DataTypes.ENUM("ventas", "finanzas", "stock"),
        allowNull: true,
      },
      firstLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      empresaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      zonaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sucursalId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "usuarios",
      timestamps: true,
    },
  );
  return Usuario;
};
