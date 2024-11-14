import fs from 'fs';
import ac from "@antiadmin/anticaptchaofficial";

export const solveImageCaptcha = async (filePath) => {
    try {
        const captcha = fs.readFileSync(filePath, { encoding: 'base64' });

        ac.setAPIKey(process.env.ANTICAPTCHA_KEY);
        ac.setSoftId(0);

        return await ac.solveImage(captcha, true)
    } catch (error) {
        console.log('test received error '+error)
    }
}