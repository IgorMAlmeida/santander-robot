import path from "path";
import fs from "fs";
import { getByXpath } from "../../../../utils.js";
import { solveImageCaptcha } from "../../Anticaptcha/Anticaptcha.js";
import logger from "../../../utils/logger.js";

export const solveCaptcha = async (page) => {
    logger.debug("Starting captcha solving process for Daycoval");
    
    try {
        logger.debug("Waiting for captcha image element");
        await page.waitForSelector('::-p-xpath(//*[@id="form1"]/img)');
        
        logger.debug("Getting captcha image element");
        const captchaImageElement = await getByXpath(
          page,
          '//*[@id="form1"]/img'
        );
        
        if (!captchaImageElement) {
            logger.error("Captcha image element not found");
            throw new Error('Captcha image element not found');
        }
        
        logger.debug("Setting up captcha image directory");
        const projectRoot = process.cwd();
        const dirPath = path.join(projectRoot, "uploads/captchaImages");
        
        if (!fs.existsSync(dirPath)) {
            logger.debug("Creating captcha images directory");
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const formattedDate = new Date().toISOString().replace(/[:.]/g, "_");
        const filePath = path.join(dirPath, `captcha_daycoval_image_${formattedDate}.png`);
        
        logger.debug("Taking screenshot of captcha", { filePath });
        await captchaImageElement.screenshot({ path: filePath });

        logger.debug("Sending captcha for solving");
        const text = await solveImageCaptcha(filePath);
        logger.info("Captcha solved successfully", { result: text });
        
        if (fs.existsSync(filePath)) {
            logger.debug("Removing captcha image file");
            fs.unlinkSync(filePath);
        }

        return text;
    } catch (error) {
        logger.error("Error solving captcha", { 
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}