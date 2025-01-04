import { findCountryByIso2Code, findExchangeRates, getAllCountries } from "@handlers/countries.mjs";
import { Config, Context } from "@netlify/functions";
import { ZodError } from "zod";

export default async function (req: Request, ctx: Context) {
  const method = req.method.toLowerCase();
  let response = new Response(null, { status: 404 });
  try {
    if (method == 'get' && ctx.url.pathname == '/api/countries')
      response = await getAllCountries(req, ctx);
    else if (method == 'get' && ctx.url.pathname == '/api/countries/exchange_rates')
      response = await findExchangeRates(req, ctx);
    else if (method == 'get' && ctx.url.pathname == '/api/countries/find')
      response = findCountryByIso2Code(req, ctx);
  } catch (e) {
    if (e instanceof ZodError) {
      return new Response(JSON.stringify(e.errors.map(({ code, message, path }) => ({ path, message, code }))), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    console.error(e);
    response = new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
  return response;
}

export const config: Config = {
  path: [
    '/api/countries',
    // '/.netlify/functions/countries/all',
    '/api/countries/exchange_rates',
    // '/.netlify/functions/countries/exchange_rates',
    '/api/countries/find'
  ]
}
