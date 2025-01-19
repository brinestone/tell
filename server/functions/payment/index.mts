import { updatePaymentMethod, findUserPaymentMethods, handleRemovePaymentMethod, handleFindPaymentProviders } from "@handlers/payment.mjs";
import { prepareHandler } from "@helpers/handler.mjs";
import { jwtAuth } from "@middleware/auth.mjs";
import { Router } from "express";

const router = Router();
router.use(jwtAuth);

router.get('/methods', findUserPaymentMethods);
router.put('/methods', updatePaymentMethod);
router.delete('/methods', handleRemovePaymentMethod);
router.get('/providers', handleFindPaymentProviders);

export const handler = prepareHandler('payment', router);
