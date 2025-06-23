import APIService from "../../Approval/APIService.js";
import dotenv from 'dotenv';
import { getValidToken, saveToken, initDatabase } from "../../../utils/tokenDatabase.js";

dotenv.config();

const SERVICE_NAME = 'FACTA_SRCC';
const TOKEN_EXPIRATION = 3600;

initDatabase().catch(err => console.error('Failed to initialize token database:', err));

export default async function getRegistration(cpf) {
  try {
    let token = await getValidToken(SERVICE_NAME);
    
    if (!token) {
      token = await login();
      if (!token) {
        return false;
      }
      await saveToken(SERVICE_NAME, token, TOKEN_EXPIRATION);
    }
    
    const isValid = await validateToken(token);
    if (!isValid) {
      token = await login();
      if (!token) {
        return false;
      }
      await saveToken(SERVICE_NAME, token, TOKEN_EXPIRATION);

      const isNewTokenValid = await validateToken(token);
      if (!isNewTokenValid) {
        return false;
      }
    }

    const response = await getBeneficio(cpf, token);
    return response.data?.beneficio?.beneficio;
  } catch (err) {
    console.error('Error in getRegistration:', err);
    return false
  }
}

async function login() {
  try {
    const data = await APIService.post("http://5.161.235.209:3000/api/auth", {
      'Content-Type': 'application/json',
    }, {
      username: process.env.FACTA_SRCC_REGISTRATION_LOGIN,
      password: process.env.FACTA_SRCC_REGISTRATION_PASS_LOGIN,
    });

    return data.token;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

async function getBeneficio(cpf, token) {
  const data = await APIService.get(
    `http://5.161.235.209:3000/api/beneficios?cpf=${cpf}`,
    {
      "Content-Type": "application/json",
      "TOKEN": token,
    }
  );

  if(data.status !== 'success') {
    return data.message;
  }

  return data;
}

export async function validateToken(token) {
  try {
    const response = await APIService.post(
      "http://5.161.235.209:3000/api/validate-token",
      {
        "TOKEN": token,
      }
    );

    return response.status === 'success';
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}