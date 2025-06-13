import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

export const api = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "Content-Type": "application/json",
    "ROBOT-KEY": `${process.env.ROBOT_KEY}`,
  }
});
