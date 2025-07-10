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
import { ItauFinancial } from './controllers/Financial/Itaú.js';
import { Biometrics } from './controllers/Biometrics/index.js';
import { FactaSRCC } from './controllers/SRCC/Facta.js';
import { ItauImovelFinancial } from './controllers/Financial/ItauImovelController.js'
import { ItauImovelStatus } from './controllers/Financial/ItauImovelStatusController.js';
import { BradescoImovelFinancial } from './controllers/Financial/BradescoImovelController.js';
import { BradescoImovelStatus } from './controllers/Financial/BradescoImovelStatusController.js';
import { UnlockBankUser } from './controllers/UnlockBankUser.js';
import { CreateBankUser } from './controllers/CreateBankUser.js';

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

        if (!req?.body?.file_id) {
            throw new Error("O ID do arquivo não foi informado");
        }

        const response = await ProposalConsult(req?.body?.file_id, req?.body?.proposals);

        if (!response.status) {
            throw new Error(response.response);
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

router.post('/api/unlock_user_bank', upload.none(), async (req, res) => {
    try {
        const response = await UnlockBankUser(req?.body);

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

router.post('/api/create_user_bank', upload.none(), async (req, res) => {
    try {
        const response = await CreateBankUser(req?.body);

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

router.post("/api/financiamento/itau", ItauFinancial);

router.post("/api/consult/srcc/facta", FactaSRCC);

router.post("/api/consult/biometrics", Biometrics);
router.post("/api/financiamento/itau/imoveis", ItauImovelFinancial);
router.get("/api/financiamento/itau/imoveis/status", ItauImovelStatus);
router.post("/api/financiamento/bradesco/imoveis", BradescoImovelFinancial);
router.get("/api/financiamento/bradesco/imoveis/status", BradescoImovelStatus);

export default router;
