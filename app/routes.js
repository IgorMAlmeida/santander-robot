import express from 'express';
import multer from 'multer';
const upload = multer();
import { santanderRobot } from './controllers/santanderRobotController.js';

const router = express.Router();

router.post('/santanderRobot', upload.none(), async (req, res) => {
    try {
        const response = await santanderRobot(req, res);

        if (response.error) {
            throw new Error(response.mensagem);
        }

        res.status(200).json(response);
    } catch (err) {

        console.error('Erro ao processar a solicitação:', err);
        res.status(500).json({ status: false, error: err });
    }
  });

export default router;
