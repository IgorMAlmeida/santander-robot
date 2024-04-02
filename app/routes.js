import express from 'express';
import multer from 'multer';
const upload = multer();
import { santanderRobot } from './controllers/santanderRobotController.js';

const router = express.Router();

router.post('/santanderRobot', upload.none(), async (req, res) => {
    try {
        const response = await santanderRobot(req, res);

        if (response.status) {
            throw new Error(response.message);
        }

        res.status(200).json(response);
    } catch (error) {

        console.error('Erro ao processar a solicitação:', message);
        res.status(500).json({ status: false, error: error.message });
    }
  });

export default router;
