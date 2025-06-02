import path from "path";
import fs from "fs";
import { getByXpath } from "../../../../utils.js";
import { solveImageCaptcha } from "../../Anticaptcha/Anticaptcha.js";
import logger from "../../../utils/logger.js";

export const solveCaptcha = async (page) => {
    logger.logMethodEntry('Daycoval.solveCaptcha', {
        url: page.url(),
        title: await page.title().catch(() => 'Não disponível')
    });
    
    try {
        logger.debug("Aguardando elemento de imagem do captcha", {
            selector: '::-p-xpath(//*[@id="form1"]/img)',
            timeout: 30000 // valor padrão do puppeteer
        });
        
        await page.waitForSelector('::-p-xpath(//*[@id="form1"]/img)');
        
        logger.debug("Obtendo elemento de imagem do captcha", {
            xpath: '//*[@id="form1"]/img'
        });
        
        const captchaImageElement = await getByXpath(
          page,
          '//*[@id="form1"]/img'
        );
        
        if (!captchaImageElement) {
            const error = new Error('Elemento de imagem do captcha não encontrado');
            logger.logError("Elemento de captcha não encontrado", error, {
                url: page.url(),
                xpath: '//*[@id="form1"]/img',
                html: await page.content().catch(() => 'Não foi possível obter o HTML')
            });
            throw error;
        }
        
        logger.debug("Configurando diretório para imagens de captcha");
        const projectRoot = process.cwd();
        const dirPath = path.join(projectRoot, "uploads/captchaImages");
        
        if (!fs.existsSync(dirPath)) {
            logger.debug("Criando diretório para imagens de captcha", {
                dirPath,
                mode: 'recursive'
            });
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const formattedDate = new Date().toISOString().replace(/[:.]/g, "_");
        const filePath = path.join(dirPath, `captcha_daycoval_image_${formattedDate}.png`);
        
        logger.debug("Capturando screenshot do captcha", { 
            filePath,
            elementType: (await (captchaImageElement.evaluate(el => el.tagName))).toLowerCase()
        });
        
        await captchaImageElement.screenshot({ path: filePath });
        
        const fileStats = fs.statSync(filePath);
        logger.debug("Arquivo de captcha salvo", {
            filePath,
            fileSize: `${fileStats.size} bytes`,
            created: fileStats.birthtime.toISOString()
        });

        logger.debug("Enviando captcha para solução");
        const text = await solveImageCaptcha(filePath);
        
        logger.info("Captcha resolvido com sucesso", { 
            result: text,
            length: text.length,
            filePath
        });
        
        if (fs.existsSync(filePath)) {
            logger.debug("Removendo arquivo temporário de captcha", {
                filePath
            });
            fs.unlinkSync(filePath);
        }

        logger.logMethodExit('Daycoval.solveCaptcha', text, {
            captchaLength: text.length,
            captchaType: 'image'
        });
        
        return text;
    } catch (error) {
        logger.logError("Erro ao resolver captcha", error, {
            url: page.url(),
            pageTitle: await page.title().catch(() => 'Não disponível')
        });
        throw error;
    }
}