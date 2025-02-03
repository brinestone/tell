import { Directive, input, OnDestroy, OnInit, output } from '@angular/core';
import { AsyncSubject, lastValueFrom, switchMap } from 'rxjs';

declare global {
  interface Window {
    grecaptcha: {
      ready: (fn: () => void) => void;
      execute: (key: string, opts: { action: string }) => Promise<string>;
    },
    recaptchaLoaded?: () => void;
  }
}

@Directive({
  selector: '[tmReCaptcha]'
})
export class Recaptcha implements OnInit, OnDestroy {
  private static scriptElement?: HTMLScriptElement;
  private static instanceCount = 0;
  private static loaded = new AsyncSubject<void>();
  readonly recaptchaKey = input.required<string>();
  readonly ready = output();

  constructor() {
    Recaptcha.instanceCount++;
  }

  async getToken(action: string) {
    if (Recaptcha.loaded.closed)
      return await window.grecaptcha.execute(this.recaptchaKey(), { action });
    return await lastValueFrom(Recaptcha.loaded.pipe(switchMap(() => window.grecaptcha.execute(this.recaptchaKey(), { action }))));
  }

  ngOnInit(): void {
    let script = Recaptcha.scriptElement;
    if (!script) {
      window.recaptchaLoaded = () => {
        Recaptcha.loaded.next();
        Recaptcha.loaded.complete();
        this.ready.emit();
      }
      script = document.createElement('script');
      Recaptcha.scriptElement = script;
      const url = new URL('/recaptcha/api.js', 'https://google.com');
      url.searchParams.set('render', this.recaptchaKey());
      url.searchParams.set('onload', 'recaptchaLoaded');
      url.searchParams.set('trustedtypes', 'true');

      script.src = url.toString();
      script.async = true;
      script.defer = true;
      script.id = 'recaptcha-script';

      document.head.appendChild(script);
    } else {
      this.ready.emit();
    }
  }

  ngOnDestroy() {
    Recaptcha.instanceCount = Math.max(Recaptcha.instanceCount - 1, 0);
    const instanceCount = Recaptcha.instanceCount;
    if (instanceCount > 0) return;
    document.getElementById('recaptcha-script')?.remove();
  }
}
