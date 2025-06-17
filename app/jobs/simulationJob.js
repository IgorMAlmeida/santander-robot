import simulation from '../services/Financiamento/ItauImovel/index.js';

export default async function simulationJob(data) {
  const result = await simulation(data);
  return result;
}
