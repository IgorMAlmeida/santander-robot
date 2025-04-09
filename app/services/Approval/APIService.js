class APIService {
    async post(url, headers, data) {
        const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) });
        const result = await response.json();
        return result;
    }

    async put(url, headers, data) {
        const response = await fetch(url, { method: 'PUT', headers: headers, body: JSON.stringify(data) });
        const result = await response.json();
        return result;
    }
}

export default new APIService();