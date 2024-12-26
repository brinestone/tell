import {Router, Request, Response} from 'express';
import {prepareHandler} from '../helpers/handler';

function ping(req: Request, res: Response) {

  res.status(200).send({message: 'pong'});
}

const router = Router();
router.get('/', ping);

export const handler = prepareHandler('posts', router);
