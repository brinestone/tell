import { getUserWalletBalances } from "@handlers/wallet.mjs";
import { prepareHandler } from "@helpers/handler.mjs";
import { auth } from "@middleware/auth.mjs";
import { Router } from "express";

const router = Router();
router.get('/balances', auth, getUserWalletBalances);

export const handler = prepareHandler('wallet', router);
