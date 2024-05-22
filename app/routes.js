import express from 'express';
import multer from 'multer';
const upload = multer();
import { santanderRobot } from './controllers/santanderRobotController.js';
import { ProposalConsult } from './controllers/OlaController.js';


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


router.post('/api/consult/proposal', async (req, res) => {
    try {
        if (!req?.body?.proposals) {
            throw new Error('Nenhuma proposta informada');
        }

        const response = await ProposalConsult(req, res);

        if (response.error) {
            throw new Error(response.mensagem);
        }

        res.status(200).json(response);
    } catch (err) {
        console.error('Erro ao processar a solicitação:', err);
        res.status(400).json({
            status: false,
            response: err.message,
            data: []
        });
    }
});

export default router;
