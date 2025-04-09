class ControllerResponse {
  success(response, data) {
    return response.status(200).json({
        status: true,
        response: data
    });
  }

  error(response, error) {
    return response.status(400).json({
        status: false,
        error: error
    });
  }
}

export default new ControllerResponse();