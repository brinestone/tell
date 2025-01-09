import pkg from "google-libphonenumber";
import { z } from "zod";
const { PhoneNumberUtil } = pkg;

export const UpdateMomoPaymentMethodSchema = z.object({
  phoneNumber: z.string()
    .refine(phone => {
      const util = PhoneNumberUtil.getInstance();
      const p = util.parseAndKeepRawInput(phone);
      return util.isValidNumber(p);
    })
});

export const UpdatePaymentMethodSchema = z.object({
  provider: z.enum(['momo']),
  data: UpdateMomoPaymentMethodSchema
});

export const RemoveMomoPaymentMethodSchema = z.object({
  provider: UpdatePaymentMethodSchema.shape.provider
})
