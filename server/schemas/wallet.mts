import { z } from "zod";
import { PaymentMethodProviderNameSchema } from "./payment-method.mjs";
import { currencyExistsByCode, handleFindExchangeRates } from "@handlers/countries.mjs";

export const WalletTopupInputValidationSchema = (production: boolean) =>  z.object({
  paymentMethod: production ? PaymentMethodProviderNameSchema.exclude(['virtual']) : PaymentMethodProviderNameSchema,
  amount: z.number().min(0),
  currency: z.string().length(3).transform(s => s.toUpperCase()).refine(c => currencyExistsByCode(c), 'Unknown currency specified')
}).refine(async ({ amount, currency }) => {
  try {
    const { XAF } = await fetch(new URL(`/api/countries/exchange_rates?src=${currency}&dest=XAF`, process.env['ORIGIN']), { method: 'GET' }).then(res => res.json());
    const inv = 1 / XAF;
    const min = Number((Number(process.env['MIN_PAYMENT_VALUE']) * inv).toFixed(2));

    return amount >= min;
  } catch (e) {
    return false
  }
}, 'Amount is too small')
