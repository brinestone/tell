import { findAllCategories } from '@handlers/category.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { Router } from 'express';

const router = Router();
router.get('/', findAllCategories);

export const handler = prepareHandler('categories', router);
