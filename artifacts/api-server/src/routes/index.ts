import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import screeningRouter from "./screening";
import enrolmentRouter from "./enrolment";
import ancRouter from "./anc";
import deliveryRouter from "./delivery";
import closeoutRouter from "./closeout";
import auditRouter from "./audit";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(screeningRouter);
router.use(enrolmentRouter);
router.use(ancRouter);
router.use(deliveryRouter);
router.use(closeoutRouter);
router.use(auditRouter);
router.use(reportsRouter);

export default router;
