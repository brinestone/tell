import { getUserWalletBalances, handleWalletTopup } from "@handlers/wallet.mjs";
import { prepareHandler } from "@helpers/handler.mjs";
import { jwtAuth } from "@middleware/auth.mjs";
import { Router } from "express";

const router = Router();
router.use(jwtAuth);

router.get('/balances', getUserWalletBalances);
router.post('/top-up', handleWalletTopup);

export const handler = prepareHandler('wallet', router);
