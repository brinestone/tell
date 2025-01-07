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
export type DisplayPrefs = Pick<UserPrefs, 'theme'|'country'|'currency'|'language'>;

export type ConnectedAccount = {
  id: string
  createdAt: Date | null
  updatedAt: Date | null
  provider: 'telegram'
  status: 'active' | 'inactive' | 'reconnect_required'
};
