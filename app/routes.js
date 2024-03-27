import express from 'express';
import { santanderRobot } from './controllers/santanderRobotController.js';

const router = express.Router();

router.get('/santanderRobot', santanderRobot);

export default router;
