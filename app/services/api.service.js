import { api } from '../utils/api.js';

export class ApiService {
  constructor(api) {
    this.api = api;
  }

  async get(url, params) {
    const response = await this.api.get(url, { params });
    return response.data;
  }
  
  async post(url, data) {
    const response = await this.api.post(url, data);
    return response.data;
  }
  
  async put(url, data) {
    const response = await this.api.put(url, data);
    return response.data;
  }
  
  async delete(url) {
    const response = await this.api.delete(url);
    return response.data;
  }
}

export default new ApiService(api);