import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, output, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { paymentMethods } from '@app/state/user';
import { Currency } from '@lib/models/country-data';
import { PaymentMethodProvider } from '@lib/models/payment-method-lookup';
import { select } from '@ngxs/store';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { concatMap, distinctUntilKeyChanged, EMPTY } from 'rxjs';

@Component({
  selector: 'tm-top-up-form',
  imports: [
    Select,
    Fluid,
    InputNumber,
    ReactiveFormsModule,
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
  readonly registeredPaymentMethods = select(paymentMethods);
  readonly form = new FormGroup({
    paymentMethod: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl('XAF', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] })
  });
  readonly selectedCurrencyCode = toSignal(this.form.controls.currency.valueChanges);
  readonly selectedCurrency = computed(() => {
    const code = this.selectedCurrencyCode() ?? 'XAF';
    return this.currencies.value()?.find(c => c.code == code)
  })

  // Resources
  readonly currencies = rxResource({
    loader: () => this.http.get<Currency[]>('/api/currencies')
  });
  readonly paymentMethodProviders = rxResource({
    loader: () => this.http.get<PaymentMethodProvider[]>('/api/payment/providers')
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
    this.http.post('/api/wallet/top-up', {
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

  constructor() {
    this.form.valueChanges.pipe(
      takeUntilDestroyed(),
      distinctUntilKeyChanged('currency'),
      concatMap(({ currency }) => {
        if (!currency || currency == 'XAF') {
          this.exchangeRate.set(1);
          return EMPTY;
        }
        return this.http.get<Record<'XAF', number>>('/api/countries/exchange_rates', {
          params: {
            src: currency,
            dest: 'XAF'
          }
        })
      })
    ).subscribe({
      next: ({ XAF }) => {
        this.exchangeRate.set(XAF);
      },
      error: (error: HttpErrorResponse) => {
        this.error.emit(error.error ?? error);
      },
    })
  }
}
