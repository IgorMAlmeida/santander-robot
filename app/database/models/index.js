import User from './Users.js';
import Certificate from './Certificates.js';

User.hasMany(Certificate, {
  foreignKey: 'user_id',
  as: 'certificates'
});

Certificate.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

export { User, Certificate };
