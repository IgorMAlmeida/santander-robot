import { toISODate } from '../../../../utils.js';
import { Certificate, User } from '../../../database/models/index.js';
import { updateOrCreate } from '../../userService.js';
import { Op } from 'sequelize';
import logger from '../../../utils/logger.js';

export async function searchCertificatesByCPF(cpf) {
  return await Certificate.findAll({
    include: [{
      model: User,
      as: 'user',
      where: { cpf }
    }],
    order: [['createdAt', 'DESC']]
  });
}

export async function saveCertificates(certificadosArray, params, consultaDate = new Date()) {
  const user = await updateOrCreate(params);

  const certificatesWithUserId = await Promise.all(certificadosArray.map(async cert => ({
    user_id: user.id,
    certifier: cert.Certificadora,
    certificate_type: cert.TipoCertificado,
    category: cert.category || '',
    certificate: cert.Certificado,
    certificate_number: cert.NumeroCertificado,
    valid_date: await toISODate(cert.DataValidade),
    situation: cert.Situacao,
    exam_date: await toISODate(cert.DataExame),
    createdAt: consultaDate,
    updatedAt: consultaDate
  })));


  logger.debug(`Certificados mapeados com sucesso: ${certificatesWithUserId} `);
  return Certificate.bulkCreate(
    certificatesWithUserId,
    {
      updateOnDuplicate: [
        'certifier', 'agent_name', 'certificate_type', 'certificate',
        'exam_date', 'valid_date', 'situation', 'updatedAt'
      ]
    }
  );
}

export async function checkCertificateExists(cpf, numeroCertificado) {
  return await Certificate.findOne({
    include: [{
      model: User,
      as: 'user',
      where: { cpf }
    }],
    where: {
      certificate_number: numeroCertificado
    }
  });
}

export async function checkCertificatesByName(cpf, certificates, consultaDate = new Date()) {
  const certificateNameFilters = Object.keys(certificates).map(name =>
    ({ certificate: { [Op.like]: `%${name}%` } })
  );

  const queryResult = await Certificate.findAll({
    include: [{
      model: User,
      as: 'user',
      where: { cpf }
    }],
    where: {
      [Op.and]: [
        { situation: 'Ativo' },
        { valid_date: { [Op.gt]: consultaDate } },
        { [Op.or]: certificateNameFilters }
      ]
    }
  });

  queryResult.forEach(cert => {
    const certLower = cert.certificate.toLowerCase();
    Object.keys(certificates).forEach(key => {
      if (certLower.includes(key.toLowerCase())) {
        certificates[key] = true;
      }
    });
  });

  const missing = Object.entries(certificates)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  return {
    status: missing.length === 0,
    missing,
    found: {...certificates},
    result: queryResult.map(r => r.toJSON()) 
  };

}

export async function searchRecentCertificates(cpf, horasLimite = 24) {
  const limitDate = new Date();
  limitDate.setHours(limitDate.getHours() - horasLimite);

  return await Certificate.findAll({
    include: [{
      model: User,
      as: 'user',
      where: { cpf }
    }],
    where: {
      createdAt: {
        [Op.gte]: limitDate
      }
    },
    order: [['createdAt', 'DESC']]
  });
}

export async function searchCertificatesByCategory(cpf, categoria) {
  return await Certificate.findAll({
    include: [{
      model: User,
      as: 'user',
      where: { cpf }
    }],
    where: {
      category: categoria
    }
  });
}
