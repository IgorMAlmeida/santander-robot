import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Certificate = sequelize.define('Certificate', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  certifier: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  certificate_type: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Categoria do tipo de certificado (ex: LGPD, Correspondente, PLDFT, etc.)'
  },
  certificate: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  certificate_number: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  exam_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  valid_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  situation: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'certificates',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['certificate_number'] },
    { fields: ['category'] },
    { fields: ['user_id', 'certificate_number'], unique: true }
  ]
});

export default Certificate;
