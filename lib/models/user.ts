import { z } from "zod";

export const RefreshTokenClaimsSchema = z.object({
  value: z.string(),
  tokenId: z.string().uuid()
});

export type RefreshTokenClaims = z.infer<typeof RefreshTokenClaimsSchema>;

export const AccessTokenClaimsSchema = z.object({
  email: z.string().email(),
  sub: z.number(),
  name: z.string(),
  image: z.string().optional(),
  tokenId: z.string().uuid(),
  aud: z.string().optional(),
  exp: z.number()
});

export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;

export type UserPrefs = {
  theme: 'dark' | 'light' | 'system';
  country: string;
  currency: string;
  id: string;
  createdAt: Date | null;
  language: string;
  updatedAt: Date | null;
  user: number;
}
export type DisplayPrefs = Pick<UserPrefs, 'theme' | 'country' | 'currency' | 'language'>;

export type ConnectedAccount = {
  id: string
  createdAt: Date | null
  updatedAt: Date | null
  provider: 'telegram'
  status: 'active' | 'inactive' | 'reconnect_required'
};
