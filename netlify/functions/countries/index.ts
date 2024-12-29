import { Request, Response, Router } from 'express';
import AllCountries                  from '../../../assets/countries.json';
import { prepareHandler }            from '../helpers/handler';

function getAllCountries(_: Request, res: Response) {
  res.json(AllCountries);
}

function getCountryByAlpha2Code(req: Request, res: Response) {
  const { alpha2Code } = req.params;
  const country = AllCountries.find(({ alpha2Code: _alpha2Code }) => _alpha2Code === alpha2Code);
  res.status(!!country ? 200 : 404).json({ country });
}

const router = Router();
router.get('/all', getAllCountries);
router.get('/:alpha2Code', getCountryByAlpha2Code);

export const handler = prepareHandler('countries', router)
