import { AccessTokenClaims, DisplayPrefs, RefreshTokenClaims } from "@lib/models/user";

const prefix = '[user]';

export class GoogleSignInFlow {
  static type = `${prefix} google sign-in flow`

  constructor(readonly apiBase: string, readonly redirect = '/') {
  }
}

export class FinishGoogleSignInFlow {
  static type = `${prefix} finish google sign-in flow`

  constructor(readonly accessToken: string, readonly refreshToken: string, readonly accessClaims: AccessTokenClaims, readonly refreshClaims: RefreshTokenClaims) {
  }
}

export class SignOut {
  static type = `${prefix} sign out`
  constructor(readonly redirect?: string) { }
}
export class SignedIn {
  static type = `${prefix} signed in`
}

export class SignedOut {
  static type = `${prefix} signed out`;
  constructor(readonly redirect?: string) { }
}

export class PrefsUpdated {
  static type = `${prefix} prefs updated`
}

export class UpdatePrefs implements Partial<DisplayPrefs> {
  constructor(readonly theme: 'dark' | 'light' | 'system', readonly country: string, readonly currency: string, readonly language: string) { }
  static type = `${prefix} upate prefs`;
}
export class SetColorMode {
  static type = `${prefix} set color mode`;
  constructor(readonly mode: 'dark' | 'light') { }
}

export class RefreshPaymentMethod {
  static type = `${prefix} refresh payment methods`;
}

export class RefreshAccessToken {
  static type = `${prefix} refresh access token`
}

export class WalletBalanceUpdated {
  static type = `${prefix} wallet balance updated`
}
