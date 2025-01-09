import { ExchangeRateResponse } from '@lib/models/country-data';
import { getStore } from '@netlify/blobs';
import { Context } from '@netlify/functions';
import _ from 'lodash';
import { z } from 'zod';
import AllCountries from '../../assets/countries.json';
import defaultLogger from '@logger/common';

const exchangeRateQuerySchema = z.object({
  src: z.string().length(3),
  dest: z.string()
    .transform(val => val.toUpperCase().split(','))
    .pipe(z.string().length(3).array())
});

const getCountryByIso2CodeSchema = z.object({
  alpha2Code: z.string()
    .length(2)
    .transform(val => val.toUpperCase())
    .or(
      z.string()
        .transform(val => val.toUpperCase().split(','))
        .pipe(z.string().length(2).array())
    )
});

export async function getAllCountries(_: Request, ctx: Context) {
  return ctx.json(AllCountries);
}

export function handleFindCountryByIso2Code(_: Request, ctx: Context) {
  const params = [...ctx.url.searchParams.entries()].reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc
  }, {} as Record<string, string>);
  const { alpha2Code } = getCountryByIso2CodeSchema.parse(params);
  return ctx.json(findCountryByIso2Code(alpha2Code));
}

export function findCountryByIso2Code(countryCode: string | string[]) {
  if (Array.isArray(countryCode))
    return AllCountries.filter(({ alpha2Code }) => countryCode.includes(alpha2Code));
  return AllCountries.find(({ alpha2Code }) => alpha2Code == countryCode);
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

  defaultLogger.debug(`looking up exchange rate from cache for ${src} -> ${dest.join(',')}`);
  const result = await ratesStore.getWithMetadata(src, { type: 'json' })
  if (!result) {
    defaultLogger.debug(`cache miss for ${src} -> ${dest.join(',')}`);
    const { rates } = await getLatestExchangeRates(src, dest);
    await ratesStore.setJSON(src, rates, { metadata: { fetchDate: new Date().valueOf() } });
    return ctx.json(pickFields(rates, ...dest));
  } else {
    defaultLogger.debug(`cache hit for ${src} -> ${dest.join(',')}`);
    const { data, metadata: { fetchDate } } = result;
    const now = new Date().valueOf();
    const then = new Date(fetchDate as number).valueOf();

    if (now > then + 6 * 3_600_000) { // Data is stale
      defaultLogger.debug(`updating stale exchange rate for ${src} -> ${dest.join(',')}`);
      const { rates } = await getLatestExchangeRates(src, dest);
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

  defaultLogger.debug(`Looking up exchange rates for ${src} -> ${dest.join(',')} from APILayer`);
  return fetch(url, { headers: { apikey: String(process.env['API_LAYER_KEY']) } })
    .then(res => res.json())
    .then(d => d as ExchangeRateResponse);
}

export function getUserCountry(req: Request, ctx: Context) {
  const { country } = ctx.geo;
  if (!country) return new Response(undefined, { status: 404 });
  return ctx.json(AllCountries.find(({ alpha2Code }) => country.code == alpha2Code));
}
