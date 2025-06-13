class ControllerResponse {
  success(response, data) {
    return response.status(200).json({
        status: true,
        response: 'Data successfully processed',
        data: data
    });
  }

  error(response, error) {
    return response.status(400).json({
        status: false,
        error: error?.message,
        details: error?.details || undefined
    });
  }
}

export default new ControllerResponse();