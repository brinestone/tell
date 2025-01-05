import { Request, Response }           from 'express';
import { useUsersDb }                  from '@helpers/db.mjs';
import { updatePrefSchema, userPrefs } from '@schemas/users';
import { findCountryByIso2Code }       from './countries.mjs';
import { extractUser }                 from '@helpers/auth.mjs';
import { eq }                          from 'drizzle-orm';

export async function updateUserPreferences(req: Request, res: Response) {
  const db = useUsersDb();
  const user = extractUser(req);
  const input = updatePrefSchema.parse(req.body);
  const [{ id }] = await db.transaction(async t => {
    return t.update(userPrefs).set(input).where(eq(userPrefs.user, user.id)).returning({ id: userPrefs.id });
  });

  const prefs =  await db.query.userPrefs.findFirst({
    where: (pref, { eq }) => eq(pref.id, id)
  });
  res.json(prefs);
}

export async function getUserPreferences(req: Request, res: Response) {
  const db = useUsersDb();
  const user = extractUser(req);
  const prefs = await db.query.userPrefs.findFirst({
    where: (prefs, { eq }) => eq(prefs.user, user.id)
  });

  res.json(prefs);
}

export async function doCreateUserPreferences(userId: number, countryCode: string) {
  const db = useUsersDb();
  const country = findCountryByIso2Code(countryCode);
  await db.insert(userPrefs).values({
    country: countryCode,
    user: userId,
    currency: country?.currencies?.[0]?.code ?? 'XAF',
    language: country?.languages?.[0]?.iso639_1 ?? 'en'
  });
}
