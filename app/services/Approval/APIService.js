import logger from "../../utils/logger.js";

class APIService {
    async get(url, headers) {
        logger.debug("Making GET request", { 
            url,
            headers: JSON.stringify(headers)
        });
        
        try {
            const response = await fetch(url, { method: 'GET', headers });
            const result = await response.json();
            
            logger.debug("GET request successful", {
                url,
                status: response.status,
                statusText: response.statusText
            });
            
            return result;
        } catch (error) {
            logger.error("GET request failed", {
                url,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async post(url, headers, data = {}) {
        logger.debug("Making POST request", { 
            url,
            headers: JSON.stringify(headers),
            data: JSON.stringify(data)
        });
        
        try {
            const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) });
            const result = await response.json();
            
            logger.debug("POST request successful", {
                url,
                status: response.status,
                statusText: response.statusText
            });
            
            return result;
        } catch (error) {
            logger.error("POST request failed", {
                url,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async put(url, headers, data = {}) {
        logger.debug("Making PUT request", { 
            url,
            headers: JSON.stringify(headers),
            data: JSON.stringify(data)
        });
        
        try {
            const response = await fetch(url, { method: 'PUT', headers: headers, body: JSON.stringify(data) });
            const result = await response.json();
            
            logger.debug("PUT request successful", {
                url,
                status: response.status,
                statusText: response.statusText
            });
            
            return result;
        } catch (error) {
            logger.error("PUT request failed", {
                url,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

export default new APIService();