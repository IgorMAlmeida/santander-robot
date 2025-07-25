class ControllerResponse {
  success(res, data) {
    return res.status(200).json({
      status: true,
      response: "Data successfully processed",
      data: data,
    });
  }

  error(res, error) {
    return res.status(400).json({
      status: false,
      error: error?.message,
      details: error?.cause || undefined,
    });
  }

  certificateError(res, response, data = null) {
    return res.status(400).json({
      status: false,
      error: response,
      data,
    });
  }

  UserExistError(res, response, data = null) {
    return res.status(400).json({
      status: false,
      error: response,
      data,
    });
  }
}

export default new ControllerResponse();