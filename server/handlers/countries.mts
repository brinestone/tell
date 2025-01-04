import { ExchangeRateResponse } from "@lib/country-data";
import { getStore } from "@netlify/blobs";
import { Context } from "@netlify/functions";
import _ from 'lodash';
import { z } from "zod";
import AllCountries from '../../assets/countries.json';

const exchangeRateQuerySchema = z.object({
  src: z.string().length(3),
  dest: z.string()
    .transform(val => val.toUpperCase().split(','))
    .pipe(z.string().length(3).array())
});

const getCountryByIso2CodeSchema = z.object({
  alpha2Code: z.string().length(2)
});

export async function getAllCountries(_: Request, ctx: Context) {
  return ctx.json(AllCountries);
}

export function findCountryByIso2Code(req: Request, ctx: Context) {
  const params = [...ctx.url.searchParams.entries()].reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc
  }, {} as Record<string, string>);
  const { alpha2Code: code } = getCountryByIso2CodeSchema.parse(params);
  const country = AllCountries.find(({ alpha2Code }) => alpha2Code == code)
  return ctx.json(country);
}

export async function findExchangeRates(req: Request, ctx: Context) {
  const params = [...ctx.url.searchParams.entries()].reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc
  }, {} as Record<string, string>);
  const { dest, src } = exchangeRateQuerySchema.parse(params);
  const ratesStore = getStore({
    name: 'exchangeRates',
    consistency: 'strong'
  });

  const result = await ratesStore.getWithMetadata(src, { type: 'json' })
  if (!result) {
    const { rates, date } = await getLatestExchangeRates(src, dest);
    await ratesStore.setJSON(src, rates, { metadata: { fetchDate: new Date().valueOf() } });
    return ctx.json(pickFields(rates, ...dest));
  } else {
    const { data, metadata: { fetchDate } } = result;
    const now = new Date().valueOf();
    const then = new Date(fetchDate as number).valueOf();

    if (now > then + 6 * 3_600_000) { // Data is stale
      const { rates, date } = await getLatestExchangeRates(src, dest);
      await ratesStore.setJSON(src, rates, { metadata: { fetchDate: new Date().valueOf() } });
      return ctx.json(pickFields(rates, ...dest));
    }

    const unsetKeys = _.difference(dest, _.keys(data));
    if (unsetKeys.length > 0) {
      const { rates: newRates, date } = await getLatestExchangeRates(src, unsetKeys);
      await ratesStore.setJSON(src, { ...data, ...newRates }, { metadata: { fetchDate: date.valueOf() } });
      return ctx.json(pickFields({ ...data, ...newRates }, ...dest));
    }

    return ctx.json(pickFields(data, ...dest));
  }
}

function pickFields(obj: Record<string, unknown>, ...keys: string[]) {
  const ans: Record<string, unknown> = {};

  for (const key of keys) {
    if (!obj[key]) continue;
    ans[key] = obj[key];
  }

  return ans;
}

async function getLatestExchangeRates(src: string, dest: string[]) {
  const url = new URL('/exchangerates_data/latest', 'https://api.apilayer.com');
  url.searchParams.set('symbols', dest.join(','));
  url.searchParams.set('base', src);

  return fetch(url, { headers: { apikey: String(process.env['API_LAYER_KEY']) } }).then(res => res.json()).then(d => d as ExchangeRateResponse)
}
