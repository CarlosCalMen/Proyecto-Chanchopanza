'use strict';

const { DataTypes, Model } = require('sequelize');

class DetalleCompra extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        compraId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'compras', key: 'id' },
        },
        insumoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'insumos', key: 'id' },
        },
        cantidad: {
          type: DataTypes.DECIMAL(10, 3),
          allowNull: false,
          defaultValue: 0.000,
          validate: { min: 0.001 },
        },
        costoUnitario: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
          comment: 'Costo al momento de la compra (snapshot)',
        },
        subtotal: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
          comment: 'cantidad * costoUnitario — persistido para rendimiento en reportes',
        },
      },
      {
        sequelize,
        modelName: 'DetalleCompra',
        tableName: 'detalle_compras',               // ← snake_case correcto para PostgreSQL
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = DetalleCompra;
