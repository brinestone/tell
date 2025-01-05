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
