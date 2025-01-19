export type CountryData = {
  name: string;
  topLevelDomain: string[];
  alpha2Code: string;
  alpha3Code: string;
  callingCodes: string[];
  capital?: string;
  altSpellings?: string[];
  subregion: string;
  region: string;
  population: number;
  latlng?: number[];
  demonym: string;
  area?: number;
  timezones: string[];
  borders?: string[];
  nativeName: string;
  numericCode: string;
  flags: Flags;
  currencies?: Currency[];
  languages: Language[];
  translations: Translations;
  flag: string;
  regionalBlocs?: RegionalBloc[];
  cioc?: string;
  independent: boolean;
  gini?: number;
}
export type Currency = {
  code: string;
  name: string;
  symbol: string;
  supports_floating_point: boolean;
}

export type Flags = {
  svg: string;
  png: string;
}

export type Language = {
  iso639_1?: string;
  iso639_2: string;
  name: string;
  nativeName?: string;
}

export type RegionalBloc = {
  acronym: string;
  name: string;
  otherNames?: string[];
  otherAcronyms?: string[];
}

export type Translations = {
  br: string;
  pt: string;
  nl: string;
  hr: string;
  fa?: string;
  de: string;
  es: string;
  fr: string;
  ja: string;
  it: string;
  hu: string;
}

export type ExchangeRateResponse = {
  base: string;
  date: Date;
  rates: ExchangeRates;
  success: boolean;
  timestamp: number;
}

export type ExchangeRates = Record<string, number>;
