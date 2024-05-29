import express from 'express';
import multer from 'multer';
import { santanderRobot } from './controllers/santanderRobotController.js';
import { ProposalConsult } from './controllers/OlaController.js';
import { SRCCConsult } from './controllers/SRCCConsult.js';
import { ConsultSRCCByFile } from './controllers/ConsultSRCCByFile.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/santanderRobot', async (req, res) => {
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

router.get('/api/consult/srcc', async (req, res) => {
    try {
        const cpf = req?.query?.cpf;

        if (!cpf) {
            throw new Error('The CPF was not informed');
        }

        const response = await SRCCConsult(cpf);

        if (!response.status) {
            throw new Error(response.response);
        }

        res.status(200).json(response);
    } catch (err) {
        console.error('Erro ao processar a solicitação:', err);
        res.status(400).json({
            status: false,
            response: err.message,
            data: null
        });
    }
});

router.post('/api/consult/srcc/upload', upload.single('file'), ConsultSRCCByFile);

export default router;
