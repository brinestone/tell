import { updatePaymentMethod, findUserPaymentMethods, handleRemovePaymentMethod } from "@handlers/payment.mjs";
import { prepareHandler } from "@helpers/handler.mjs";
import { jwtAuth } from "@middleware/auth.mjs";
import { Router } from "express";

const router = Router();
router.get('/methods', jwtAuth, findUserPaymentMethods);
router.put('/methods', jwtAuth, updatePaymentMethod);
router.delete('/methods', jwtAuth, handleRemovePaymentMethod);

export const handler = prepareHandler('payment', router);
