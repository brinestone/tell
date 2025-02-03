import { AsyncPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneDirective } from '@app/directives/phone.directive';
import { pmMomo } from '@app/state/user';
import { phoneValidator } from '@app/util/phone-valiator';
import { CountryData } from '@lib/models/country-data';
import { select } from '@ngxs/store';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { filter, map, startWith } from 'rxjs';
import { environment } from '@env/environment.development';
const momoSupportedCountries = ['BJ', 'BW', 'BF', 'BI', 'CM', 'TD', 'CG', 'CD', 'CI', 'GH', 'GN', 'GW', 'KE', 'MW', 'ML', 'MZ', 'NE', 'NG', 'RW', 'SN', 'SC', 'SL', 'SO', 'SS', 'SZ', 'TZ', 'TG', 'UG', 'ZM', 'ZW', 'CN', 'IN', 'PH', 'TR', 'CA', 'ET'];
const util = PhoneNumberUtil.getInstance();

@Component({
  selector: 'tm-momo',
  imports: [
    Tag,
    Select,
    ReactiveFormsModule,
    Button,
    PhoneDirective,
    InputText,
    ConfirmPopupModule,
    InputGroupAddon,
    InputGroup,
    AsyncPipe,
    Message,
  ],
  providers: [ConfirmationService],
  templateUrl: './momo.component.html',
  styleUrl: './momo.component.scss'
})
export class MomoComponent {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  readonly updated = output();
  readonly momoPaymentMethod = select(pmMomo);
  readonly momoPaymentMethodConnected = computed(() => {
    return this.momoPaymentMethod()?.status === 'active';
  });
  readonly momoCountries = signal<CountryData[]>([]);
  readonly loadingMomoCountries = signal(false);
  readonly showMomoNumberInput = signal(false);
  readonly form = new FormGroup({
    code: new FormControl('CM', [Validators.required]),
    number: new FormControl('', [Validators.required])
  }, [phoneValidator()]);
  readonly samplePhoneNumber$ = this.form.controls.code.valueChanges.pipe(
    startWith(this.form.value.code),
    takeUntilDestroyed(),
    map(code => util.getExampleNumber(code!)),
    filter(p => !!p),
    map(p => util.format(p, PhoneNumberFormat.NATIONAL))
  );
  readonly connectionStatusText = computed(() => {
    const method = this.momoPaymentMethod();
    const submitting = this.submitting();
    if (submitting) return 'connecting';

    switch (method?.status) {
      default: return 'not connected';
      case 'active': return 'connected';
      case 'inactive':
      case 're-connection required':
        return 'attention required'
    }
  });
  readonly connectionStatusSeverityText = computed(() => {
    const method = this.momoPaymentMethod();
    const submitting = this.submitting();
    if (submitting) return 'info';

    switch (method?.status) {
      default: return 'secondary';
      case 'active': return 'success';
      case 'inactive':
      case 're-connection required':
        return 'warn'
    }
  });
  readonly submitting = signal(false);
  readonly disconnecting = signal(false);

  constructor() {
    effect(() => {
      const showingMomoNumberInput = this.showMomoNumberInput();
      const momoCountries = this.momoCountries();
      if (!showingMomoNumberInput || momoCountries.length == momoSupportedCountries.length) return;

      this.loadingMomoCountries.set(true);
      this.http.get<CountryData[]>(environment.apiOrigin + '/countries/find', {
        params: {
          alpha2Code: momoSupportedCountries.join(',')
        }
      }).subscribe({
        next: countries => this.momoCountries.set(countries),
        complete: () => {
          this.loadingMomoCountries.set(false)
        },
        error: (error: Error) => {
          console.error(error);
          this.loadingMomoCountries.set(false);
        }
      });
    })
  }

  onFormSubmit() {
    const { code, number } = this.form.value;
    const p = util.parse(String(number), code!);
    const phoneNumber = util.format(p, PhoneNumberFormat.E164);

    this.submitting.set(true);
    this.http.patch(environment.apiOrigin + '/payment/method', { data: { phoneNumber }, provider: 'momo' }).subscribe({
      error: (error: HttpErrorResponse) => {
        this.messageService.add({
          summary: 'Error',
          severity: 'error',
          detail: error.error?.message ?? error.message
        });
        this.submitting.set(false);
      },
      complete: () => {
        this.submitting.set(false);
        this.form.reset();
        this.form.patchValue({ code });
        this.form.markAsUntouched();
        this.form.markAsPristine();
        this.showMomoNumberInput.set(false);
        this.updated.emit();
      }
    });
  }

  onDisconnectButtonClicked(event: MouseEvent) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to proceed?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        size: 'small',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Disconnect',
        size: 'small',
        severity: 'danger'
      },
      accept: () => {
        this.disconnecting.set(true);
        this.http.delete(environment.apiOrigin + '/payment/methods', { params: { provider: 'momo' } }).subscribe({
          error: (error: HttpErrorResponse) => {
            this.messageService.add({
              summary: 'Error',
              severity: 'error',
              detail: error.error?.message ?? error.message
            });
            this.disconnecting.set(false);
          },
          complete: () => {
            this.disconnecting.set(false);
            this.updated.emit();
          }
        });
      }
    });
  }
}
