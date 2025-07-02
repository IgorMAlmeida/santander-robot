import fs from 'fs';
import dotenv from 'dotenv';
import { FormData } from "formdata-node";
import { File } from "fetch-blob/from.js";

dotenv.config();

export const solveImageCaptchaGemini = async (filePath) => {
    try {
        const form = new FormData();
        const imageBuffer = await fs.promises.readFile(filePath);

        const file = new File([imageBuffer], "image.png", {
          type: "image/png",
        });
        form.append("image", file);

      const response = await fetch(
        `${process.env.ANTICAPTCHA_GEMINI_URL}/anti-captcha/process`,
        {
          method: "POST",
          headers: form.headers,
          body: form,
        }
      );

      const { data } = await response.json();
      return data;
    } catch (error) {
        console.log('test received error '+error)
        throw error;
    }
}