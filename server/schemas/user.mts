import { hashThese } from '../util';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { AccessTokenClaimsSchema, RefreshTokenClaimsSchema } from '@lib/models/user';

const { verify } = jwt;

export const CodeVerificationSchema = z.object({
  code: z.string().length(6).transform(arg => hashThese(arg))
});

export const RefreshTokenValidationSchema = z.object({
  token: z.string()
    .transform(t => verify(t, String(process.env['JWT_SECRET'])))
    .pipe(RefreshTokenClaimsSchema).transform(({ value, tokenId }) => ({ value, tokenId }))
});

export const AccessTokenValidationSchema = z.string()
  .refine(t => verify(t, String(process.env['JWT_SECRET'])))
  .pipe(
    AccessTokenClaimsSchema
  );
