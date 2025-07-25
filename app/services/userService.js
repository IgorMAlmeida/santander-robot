import User from '../database/models/Users.js';

export async function searchOrCreate(params) {
  const [user, created] = await User.findOrCreate({
    where: { cpf: params.cpf },
    defaults: { cpf: params.cpf, name: params.name }
  });
  
  if (created) {
    console.log(`Novo usuário criado para CPF: ${params.cpf} - Nome: ${params.name}`);
  }
  
  return user;
}

export async function updateOrCreate(params) {
  let user = await User.findOne({ where: { cpf: params.cpf } });

  if (user) {
    let updated = false;
    for (const key of Object.keys(params)) {
      if (params[key] && user[key] !== params[key]) {
        user[key] = params[key];
        updated = true;
      }
    }
    if (updated) {
      await user.save();
      console.log(`Usuário CPF:${params.cpf} atualizado.`);
    }
    return user;
  } else {
    user = await User.create(params);
    console.log(`Novo usuário criado para CPF: ${params.cpf}`);
    return user;
  }
}


export async function searchByCPF(cpf) {
  return await User.findOne({
    where: { cpf }
  });
}
