import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const User = sequelize.define('User', {
  cpf: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['cpf'], unique: true }
  ]
});

export default User;
