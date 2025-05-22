import path from "path";
import fs from "fs";
import { getByXpath } from "../../../../utils.js";
import { solveImageCaptcha } from "../../Anticaptcha/Anticaptcha.js";

export const solveCaptcha = async (page) => {
    try {
        await page.waitForSelector('::-p-xpath(//*[@id="form1"]/img)');
        const captchaImageElement = await getByXpath(
          page,
          '//*[@id="form1"]/img'
        );
        
        if (!captchaImageElement) {
            throw new Error('Captcha image element not found');
        }
        
        const projectRoot = process.cwd();
        const dirPath = path.join(projectRoot, "uploads/captchaImages");
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const formattedDate = new Date().toISOString().replace(/[:.]/g, "_");
        const filePath = path.join(dirPath, `captcha_daycoval_image_${formattedDate}.png`);
        
        await captchaImageElement.screenshot({ path: filePath });

        const text = await solveImageCaptcha(filePath);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return text;
    } catch (error) {
        console.error('Error solving captcha:', error);
        throw error;
    }
}