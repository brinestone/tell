const prefix = '[user]';

export class GoogleSignInFlow {
  static type = `${prefix} google sign-in flow`

  constructor(readonly apiBase: string, readonly redirect = '/') {
  }
}

export class FinishGoogleSignInFlow {
  static type = `${prefix} finish google sign-in flow`
  constructor(readonly accessToken: string){}
}
