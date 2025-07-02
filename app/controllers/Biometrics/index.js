import biometrics from "../../services/Biometrics/index.js";
import ControllerResponse from "../../utils/ControllerResponse.js";

export async function Biometrics(req, res) {
  try {
    const cpfs = req?.body?.cpfs;

    if (!cpfs) {
      throw new Error("Faltou os CPFs");
    }

    const result = await biometrics(cpfs);

    return ControllerResponse.success(res, result);
  } catch (error) {
    return ControllerResponse.error(res, error);
  }
}
