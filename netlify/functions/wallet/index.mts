import { prepareHandler } from "@helpers/handler.mjs";
import { Router } from "express";

const router = Router();
export const handler = prepareHandler('wallet', router);
