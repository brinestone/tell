import { Component, effect, inject, model, resource }                         from '@angular/core';
import { TableModule }                                                        from 'primeng/table';
import { Button }                                                             from 'primeng/button';
import { InputText }                                                          from 'primeng/inputtext';
import { IconField }                                                          from 'primeng/iconfield';
import { InputIcon }                                                          from 'primeng/inputicon';
import { Drawer }                                                             from 'primeng/drawer';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Message }                                                            from 'primeng/message';
import { Fluid }                                                              from 'primeng/fluid';
import { Textarea }                                                           from 'primeng/textarea';
import { Step, StepList, StepPanel, StepPanels, Stepper }                     from 'primeng/stepper';
import { NgTemplateOutlet }                                                   from '@angular/common';
import { MultiSelect }                                                        from 'primeng/multiselect';
import { Category }                                                           from '@lib/category';
import { MessageService }                                                     from 'primeng/api';
import { takeUntilDestroyed }                                                 from '@angular/core/rxjs-interop';
import { Select }                                                             from 'primeng/select';
import { PhoneDirective }                                                     from '@app/directives/phone.directive';
import { PhoneNumberUtil }                                                    from 'google-libphonenumber';
import { CountryData }                                                        from '@lib/country-data';

function newEmailControl() {
  return new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(100), Validators.email]
  })
}

function newPhoneControl(defaultCode = 'CM') {
  return new FormGroup({
    code: new FormControl<string>(defaultCode, {
      nonNullable: true,
    }),
    number: new FormControl('', { nonNullable: false })
  }, [(group) => {
    try {
      const codeControl = group.get('code');
      const numberControl = group.get('number');
      if (codeControl?.value && !numberControl?.value) return null;
      else if (!codeControl?.value || !numberControl?.value) return { phoneInvalid: true };
      const phoneUtil = PhoneNumberUtil.getInstance();
      const parsed = phoneUtil.parseAndKeepRawInput(numberControl.value, codeControl.value);
      return phoneUtil.isValidNumberForRegion(parsed, codeControl.value) ? null : { phoneInvalid: true };
    } catch (e) {
      return { phoneInvalid: true };
    }
  }])
}

@Component({
  selector: 'tm-campaigns',
  imports: [
    TableModule,
    Button,
    InputText,
    IconField,
    InputIcon,
    Drawer,
    ReactiveFormsModule,
    Message,
    Fluid,
    Textarea,
    Stepper,
    Step,
    StepList,
    StepPanels,
    StepPanel,
    NgTemplateOutlet,
    MultiSelect,
    Select,
    PhoneDirective
  ],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.scss'
})
export class CampaignsComponent {
  private messageService = inject(MessageService);
  showNewCampaignModal = model(true);
  newCampaignFormStep = model(2);
  readonly categories = resource({
    loader: async ({ abortSignal }) => {
      const res = await fetch('/api/categories', { signal: abortSignal });
      const m = await res.json();
      return m as Category[];
    }
  });
  readonly countries = resource({
    loader: async ({ abortSignal }) => {
      const res = await fetch('/api/countries/all', { signal: abortSignal });
      const m = await res.json();
      return m as CountryData[];
    }
  })
  readonly newCampaignForm = new FormGroup({
    basic: new FormGroup({
      title: new FormControl('', [Validators.required, Validators.maxLength(255)]),
      description: new FormControl('', [Validators.required, Validators.maxLength(2000)]),
      categories: new FormControl<number[]>([], [Validators.required, Validators.minLength(1)])
    }),
    contactsAndLinks: new FormGroup({
      emails: new FormArray<FormControl<string>>([newEmailControl()]),
      phones: new FormArray<FormGroup<{
        code: FormControl<string>;
        number: FormControl<string | null>
      }>>([newPhoneControl()]),
      links: new FormArray<FormControl<string>>([])
    })
  });

  addEmailControl() {
    this.newCampaignForm.controls.contactsAndLinks.controls.emails.push(newEmailControl());
  }

  removeEmailControl(index: number) {
    this.newCampaignForm.controls.contactsAndLinks.controls.emails.removeAt(index);
  }

  addPhoneControl() {
    this.newCampaignForm.controls.contactsAndLinks.controls.phones.push(newPhoneControl(this.newCampaignForm.controls.contactsAndLinks.controls.phones.at(-1).value.code ?? 'CM'));
  }

  removePhoneControl(index: number) {
    this.newCampaignForm.controls.contactsAndLinks.controls.phones.removeAt(index);
  }

  constructor() {
    this.newCampaignForm.controls.contactsAndLinks.controls.phones.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(values => {
      if (!values.every(v => (v.number?.length ?? 0) > 0)) return;
      this.addPhoneControl();
    })
    this.newCampaignForm.controls.contactsAndLinks.controls.emails.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(values => {
      if (!values.every(v => v.length > 0)) return;
      this.addEmailControl();
    });
    effect(() => {
      const fetchError = this.categories.error();
      if (!fetchError) return;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: (fetchError as Error).message,
      })
    });
  }
}
