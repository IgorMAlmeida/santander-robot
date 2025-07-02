import APIService from "../../Approval/APIService.js";
import dotenv from 'dotenv';

dotenv.config();

export default async function getRegistrations(cpfs) {
  try {
    const response = await getBeneficios(cpfs);
    return response.data;
  } catch (err) {
    console.error('Error in getRegistration:', err);
    throw err;
  }
}


async function getBeneficios(cpfs) {
  const data = await APIService.post(
    `http://5.161.235.209:3000/api/beneficios-em-lote`,
    {
      "Content-Type": "application/json",
      "API-KEY": process.env.FACTA_SRCC_REGISTRATION_API_KEY,
    },
    { cpfs }
  );

  if(data.status !== 'success') {
    return data.message;
  }

  return data;
}