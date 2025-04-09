import express from 'express';
import multer from 'multer';
import { santanderRobot, santanderRobotProposal } from './controllers/santanderRobotController.js';
import { ProposalConsult } from './controllers/OlaController.js';
import { C6Consult } from './controllers/C6Consult.js';
import { ConsultSRCCByArray } from './controllers/ConsultSRCCByArray.js';
import { PortalConsig } from './controllers/PortalConsig.js';
import { C6Approval } from './controllers/Approval/C6.js';
import { DaycovalApproval } from './controllers/Approval/Daycoval.js';
import { FactaApproval } from './controllers/Approval/Facta.js';
import { OLEApproval } from './controllers/Approval/OLE.js';
const upload = multer({ dest: 'uploads/' });
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

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

router.get('/api/consult/c6/srcc', async (req, res) => {
    try {
        const proposal = req?.query?.proposal;

        if (!proposal) {
            throw new Error('The proposal was not informed');
        }

        const response = await C6Consult(proposal);

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

router.post('/api/consult/srcc/proposals', ConsultSRCCByArray);



router.post('/api/consult/portal_consig', upload.none(), async (req, res) => {
    try {
        const data = {
            cpf: req?.body?.cpf,       
            registration: req?.body?.matricula,
            destiny: req?.body?.destino,  
        };
        
        if (!data.cpf || !data.registration || !data.destiny) {
            throw new Error('Missing parameters');
        }
        
        const response = await PortalConsig(data);

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


router.post('/santander_proposals', async (req, res) => {
    try {

        const response = await santanderRobotProposal(req, res);

        res.status(200).json(response);
    } catch (err) {

        console.error('Erro ao processar a solicitação:', err);
        res.status(500).json({ status: false, error: err });
    }
});

router.post("/api/consult/aprovacao/c6/proposal", C6Approval);
router.post("/api/consult/aprovacao/daycoval/proposal", DaycovalApproval);
router.post("/api/consult/aprovacao/facta/proposal", FactaApproval);
router.post("/api/consult/aprovacao/ole/proposal", OLEApproval);

export default router;
