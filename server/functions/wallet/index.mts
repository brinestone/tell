import { getUserWalletBalances } from "@handlers/wallet.mjs";
import { prepareHandler } from "@helpers/handler.mjs";
import { jwtAuth } from "@middleware/auth.mjs";
import { Router } from "express";

const router = Router();
router.use(jwtAuth);

router.get('/balances', getUserWalletBalances);

export const handler = prepareHandler('wallet', router);
