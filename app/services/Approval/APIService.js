import logger from "../../utils/logger.js";

class APIService {
    async get(url, headers) {
        logger.logMethodEntry('APIService.get', { 
            url,
            headersKeys: Object.keys(headers)
        });
        
        try {
            logger.debug("Iniciando requisição GET", { 
                url,
                headers: Object.keys(headers).join(', ')
            });
            
            const response = await fetch(url, { method: 'GET', headers });
            
            logger.debug("Resposta da requisição GET recebida", {
                url,
                status: response.status,
                statusText: response.statusText,
                responseSize: response.headers.get('content-length') || 'desconhecido'
            });
            
            const result = await response.json();
            
            logger.logMethodExit('APIService.get', result, {
                url,
                status: response.status
            });
            
            return result;
        } catch (error) {
            logger.logError("Falha na requisição GET", error, {
                url,
                headers: Object.keys(headers).join(', ')
            });
            throw error;
        }
    }

    async post(url, headers, data = {}) {
        logger.logMethodEntry('APIService.post', { 
            url,
            headersKeys: Object.keys(headers),
            dataKeys: Object.keys(data)
        });
        
        try {
            logger.debug("Iniciando requisição POST", { 
                url,
                headers: Object.keys(headers).join(', '),
                dataKeys: Object.keys(data).join(', ')
            });
            
            const bodyContent = JSON.stringify(data);
            logger.debug("Corpo da requisição POST preparado", { 
                bodySize: bodyContent.length,
                contentType: headers['Content-Type'] || headers['content-type'] || 'application/json'
            });
            
            const response = await fetch(url, { 
                method: 'POST', 
                headers: headers, 
                body: bodyContent 
            });
            
            logger.debug("Resposta da requisição POST recebida", {
                url,
                status: response.status,
                statusText: response.statusText,
                responseSize: response.headers.get('content-length') || 'desconhecido'
            });
            
            const result = await response.json();
            
            logger.logMethodExit('APIService.post', result, {
                url,
                status: response.status
            });
            
            return result;
        } catch (error) {
            logger.logError("Falha na requisição POST", error, {
                url,
                headers: Object.keys(headers).join(', '),
                dataKeys: Object.keys(data).join(', ')
            });
            throw error;
        }
    }

    async put(url, headers, data = {}) {
        logger.logMethodEntry('APIService.put', { 
            url,
            headersKeys: Object.keys(headers),
            dataKeys: Object.keys(data)
        });
        
        try {
            logger.debug("Iniciando requisição PUT", { 
                url,
                headers: Object.keys(headers).join(', '),
                dataKeys: Object.keys(data).join(', ')
            });
            
            const bodyContent = JSON.stringify(data);
            logger.debug("Corpo da requisição PUT preparado", { 
                bodySize: bodyContent.length,
                contentType: headers['Content-Type'] || headers['content-type'] || 'application/json'
            });
            
            const response = await fetch(url, { 
                method: 'PUT', 
                headers: headers, 
                body: bodyContent 
            });
            
            logger.debug("Resposta da requisição PUT recebida", {
                url,
                status: response.status,
                statusText: response.statusText,
                responseSize: response.headers.get('content-length') || 'desconhecido'
            });
            
            const result = await response.json();
            
            logger.logMethodExit('APIService.put', result, {
                url,
                status: response.status
            });
            
            return result;
        } catch (error) {
            logger.logError("Falha na requisição PUT", error, {
                url,
                headers: Object.keys(headers).join(', '),
                dataKeys: Object.keys(data).join(', ')
            });
            throw error;
        }
    }
}

export default new APIService();