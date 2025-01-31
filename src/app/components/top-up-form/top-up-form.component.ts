import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { paymentMethods } from '@app/state/user';
import { environment } from '@env/environment.development';
import { Currency } from '@lib/models/country-data';
import { PaymentMethodProvider } from '@lib/models/payment-method-lookup';
import { select } from '@ngxs/store';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { catchError, concatMap, distinctUntilKeyChanged, EMPTY, retry, tap, throwError } from 'rxjs';

@Component({
  selector: 'tm-top-up-form',
  imports: [
    Select,
    Fluid,
    InputNumber,
    ReactiveFormsModule,
    RouterLink,
    Button,
    DecimalPipe,
    Message,
    CurrencyPipe
  ],
  templateUrl: './top-up-form.component.html',
  styleUrl: './top-up-form.component.scss'
})
export class TopUpFormComponent {
  private http = inject(HttpClient);
  readonly submitting = signal(false);
  readonly error = output<Error>();
  readonly onSubmit = output();
  readonly exchangeRate = signal(1);
  readonly gettingExchangeRate = signal(false);
  readonly registeredPaymentMethods = select(paymentMethods);
  readonly initialCurrency = input<string>();
  readonly form = new FormGroup({
    paymentMethod: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl('XAF', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] })
  });
  readonly selectedCurrencyCode = toSignal(this.form.controls.currency.valueChanges);
  readonly selectedCurrency = computed(() => {
    const code = this.selectedCurrencyCode() ?? 'XAF';
    return this.currencies.value()?.find(c => c.code == code)
  });
  readonly minAmountValue = computed(() => {
    const rate = this.exchangeRate();
    const inv = 1 / rate;
    const ans = Number((environment.minPaymentValue * inv).toFixed(2));
    return ans;
  })

  // Resources
  readonly currencies = rxResource({
    loader: () => this.http.get<Currency[]>(environment.apiOrigin + '/finance/currencies')
  });
  readonly paymentMethodProviders = rxResource({
    loader: () => this.http.get<PaymentMethodProvider[]>(environment.apiOrigin + '/payment/providers')
  });
  readonly paymentMethods = computed(() => {
    const providers = this.paymentMethodProviders.value() ?? [];
    const methods = this.registeredPaymentMethods();

    return methods.filter(({ provider }) => providers.some(p => p.name == provider))
      .map(p => {
        const provider = providers.find(pr => pr.name == p.provider) as PaymentMethodProvider;
        return { ...p, provider };
      });
  });

  onFormSubmit() {
    this.submitting.set(true);
    const { amount, currency, paymentMethod } = this.form.value;
    this.http.post(environment.apiOrigin + '/wallet/top-up', {
      paymentMethod,
      currency,
      amount
    }).subscribe({
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.emit(error.error ?? error);
      },
      complete: () => {
        this.submitting.set(false);
        this.form.reset();
        this.onSubmit.emit();
      }
    });
  }

  reset() {
    this.form.reset();
    this.form.patchValue({
      amount: 0,
      currency: this.initialCurrency() ?? 'XAF',
      paymentMethod: this.registeredPaymentMethods()?.[0]?.provider
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.form.updateValueAndValidity();
  }

  constructor() {
    effect(() => {
      const min = this.minAmountValue();
      this.form.controls.amount.setValidators([Validators.required, Validators.min(min)]);
      this.form.controls.amount.updateValueAndValidity();
    });
    effect(() => {
      const currency = this.selectedCurrency();
      if (!currency || currency.supports_floating_point) return;
      const amount = Number(this.form.value.amount);
      if (isNaN(amount)) return;

      this.form.patchValue({
        amount: Math.floor(amount)
      })
    });
    this.form.valueChanges.pipe(
      takeUntilDestroyed(),
      distinctUntilKeyChanged('currency'),
      concatMap(({ currency }) => {
        if (!currency || currency == 'XAF') {
          this.exchangeRate.set(1);
          return EMPTY;
        }
        this.gettingExchangeRate.set(true);
        return this.http.get<Record<'XAF', number>>(environment.apiOrigin + '/finance/exchange_rates', {
          params: {
            src: currency,
            dest: 'XAF'
          }
        }).pipe(
          retry({ count: 10, delay: 3000 }),
          tap(() => {
            setTimeout(() => this.gettingExchangeRate.set(false), 10);
          }),
          catchError((e) => {
            setTimeout(() => this.gettingExchangeRate.set(false), 10);
            return throwError(() => e);
          })
        )
      }),
    ).subscribe({
      next: ({ XAF }) => {
        this.exchangeRate.set(XAF);
      },
      error: (error: HttpErrorResponse) => {
        this.error.emit(error.error ?? error);
      }
    })
  }
}
