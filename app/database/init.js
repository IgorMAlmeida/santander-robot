import sequelize from './connection.js';
import Certificate from './models/Certificates.js';
import User from './models/Users.js';

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com MySQL estabelecida');
    
    await User.sync({ alter: true });
    await Certificate.sync({ alter: true });

    console.log('Tabelas sincronizadas com timestamps');
    
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco:', error);
    throw error;
  }
}
