import { hashThese } from "../util";
import { z } from "zod";

export const CodeVerificationSchema = z.object({
  code: z.string().length(6).transform(arg => hashThese(arg))
})
