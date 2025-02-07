import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, OnInit, viewChild } from '@angular/core';
import { Recaptcha } from '@app/directives';
import { principal } from '@app/state/user';
import { Sha256 } from '@aws-crypto/sha256-js';
import { environment } from '@env/environment.development';
import { Navigate } from '@ngxs/router-plugin';
import { dispatch, select } from '@ngxs/store';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { z } from 'zod';

const AnalyticsQueryInputSchema = z.object({
  id: z.string().uuid(),
  t: z.enum(['broadcast']),
  r: z.string()
})

@Component({
  selector: 'tm-analytics',
  imports: [
    Recaptcha
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  readonly siteKey = environment.recaptchaSiteKey;
  private recaptchaV3 = viewChild(Recaptcha);
  private navigate = dispatch(Navigate);
  private inputParams = injectQueryParams();
  private params = computed(() => {
    const { data, error, success } = AnalyticsQueryInputSchema.safeParse(this.inputParams());
    if (!success) {
      return undefined;
    }
    return data;
  });
  private principal = select(principal);
  readonly failed = linkedSignal(() => {
    const { success } = AnalyticsQueryInputSchema.safeParse(this.inputParams());
    return !success;
  })

  async ngOnInit() {
    const code = await this.computeDeviceCode();
    console.log(code);
  }

  private async computeDeviceCode() {
    const { origin } = await fetch('https://httpbin.org/ip').then(res => res.json());
    const parameters = [
      navigator.maxTouchPoints,
      window.screen.height,
      window.screen.width,
      navigator.hardwareConcurrency,
      origin
    ].join(',');

    const hash = new Sha256();
    hash.update(parameters);
    return await hash.digest()
      .then(u => Array.from(u)
        .map(byte => byte.toString(16).padStart(2, '0')).join(''));
  }

  async onRecaptchaReady() {
    const token = await this.recaptchaV3()?.getToken('analytics');
    const params = this.params();
    if (!params || !token) {
      this.failed.set(true)
      // timer(5000).subscribe(() => {
      //   this.navigate(['/']);
      // });
      // return;
    }

    this.http.post(`${environment.apiOrigin}/analytics`, {
      type: params?.t,
      key: params?.id,
      data: {
        deviceInfo: {
          hash: await this.computeDeviceCode(),
          height: window.screen.height,
          width: window.screen.width,
          concurrency: navigator.hardwareConcurrency,
        }
      }
    }, {
      headers: {
        'x-recaptcha': token as string,
      }
    }).subscribe({
      complete: () => {
        location.href = params?.r as unknown as string;
      },
      error: () => {
        location.href = params?.r as unknown as string;
      }
    })
  }
}
