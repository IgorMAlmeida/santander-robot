import axios from "axios";
import logger from "./logger.js";

class HttpService {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        "Accept-Encoding": "br, gzip, deflate",
      },
    });
  }

  async get(url, headers = {}) {
    logger.logMethodEntry("HttpService.get", {
      url,
      headersKeys: Object.keys(headers),
    });

    try {
      logger.debug("Iniciando requisição GET", { url, headers });

      const response = await this.client.get(url, {
        headers,
        responseType: "json",
        validateStatus: (status) => status < 500,
      });

      logger.debug("Resposta GET recebida", {
        url,
        status: response.status,
        statusText: response.statusText,
        responseSize: JSON.stringify(response.data).length,
      });

      logger.logMethodExit("HttpService.get", response.data, {
        status: response.status,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        logger.logError("Erro na resposta GET", error, {
          url,
          status: error.response.status,
          statusText: error.response.statusText,
        });
        return error.response.data;
      } else if (error.request) {
        logger.logError("Erro na requisição GET - sem resposta", error, {
          url,
        });
        throw error;
      } else {
        logger.logError("Erro na requisição GET", error, { url });
        throw error;
      }
    }
  }

  async post(url, headers = {}, data = {}) {
    logger.logMethodEntry("HttpService.post", {
      url,
      headersKeys: Object.keys(headers),
      dataKeys: Object.keys(data),
    });

    try {
      const postData = Object.entries(data)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("&");

      logger.debug("Iniciando requisição POST", {
        url,
        headers,
        postData,
      });

      const response = await this.client.post(url, postData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...headers,
        },
        responseType: "json",
        validateStatus: (status) => status < 500,
      });
      
      logger.logMethodExit("HttpService.post", response.data, {
        status: response.status,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        logger.logError("Erro na resposta POST", error, {
          url,
          status: error.response.status,
          statusText: error.response.statusText,
        });
        return error.response.data;
      } else if (error.request) {
        logger.logError("Erro na requisição POST - sem resposta", error, {
          url,
        });
        throw error;
      } else {
        logger.logError("Erro na requisição POST", error, { url });
        throw error;
      }
    }
  }
}

export default new HttpService();
