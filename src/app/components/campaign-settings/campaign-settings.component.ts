import { NgPlural, NgPluralCase, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject, input } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneDirective } from '@app/directives/phone.directive';
import { phoneValidator } from '@app/util/phone-valiator';
import { Campaign } from '@lib/models/campaign';
import { Category } from '@lib/models/category';
import { CountryData } from '@lib/models/country-data';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { AccordionModule, } from 'primeng/accordion';
import { Button } from 'primeng/button';
import { Fieldset } from 'primeng/fieldset';
import { Inplace } from 'primeng/inplace';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
const phoneUtil = PhoneNumberUtil.getInstance();

function newAttachmentControl(url: string) {
  return new FormControl<string>(url, { nonNullable: true });
}

function newEmailControl() {
  return new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(100), Validators.email]
  });
}

function newPhoneControl(defaultCode = 'CM') {
  return new FormGroup({
    code: new FormControl<string>(defaultCode, {
      nonNullable: true,
    }),
    number: new FormControl('', { nonNullable: false })
  }, [phoneValidator()]);
}

function newLinkControl() {
  return new FormControl('', [Validators.pattern(/^((http|https|ftp):\/\/)?(([\w-]+\.)+[\w-]+)(:\d+)?(\/[\w-]*)*(\?[\w-=&]*)?(#[\w-]*)?$/)])
}

@Component({
  selector: 'tm-campaign-settings',
  imports: [PhoneDirective, Select, NgTemplateOutlet, ReactiveFormsModule, Message, AccordionModule, Fieldset, Textarea, Inplace, InputText, Button, MultiSelect, NgPlural, NgPluralCase],
  templateUrl: './campaign-settings.component.html',
  styleUrl: './campaign-settings.component.scss'
})
export class CampaignSettings implements AfterViewInit {
  private http = inject(HttpClient);
  readonly campaign = input<Campaign>();
  readonly categories = rxResource({
    loader: () => this.http.get<Category[]>('/api/categories')
  });
  readonly countries = rxResource({
    loader: () => this.http.get<CountryData[]>('/api/countries')
  });
  readonly form = new FormGroup({
    general: new FormGroup({
      title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      categories: new FormControl<string[]>([], { nonNullable: true, validators: [Validators.required] }),
      redirectUrl: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^((http|https|ftp):\/\/)?(([\w-]+\.)+[\w-]+)(:\d+)?(\/[\w-]*)*(\?[\w-=&]*)?(#[\w-]*)?$/)] })
    }),
    linksAndContacts: new FormGroup({
      links: new FormArray<FormControl<string | null>>([newLinkControl()]),
      phoneNumbers: new FormArray<FormGroup<{
        code: FormControl<string>;
        number: FormControl<string | null>;
      }>>([newPhoneControl()]),
      emails: new FormArray<FormControl<string>>([newEmailControl()])
    }),
    attachments: new FormArray<FormControl<string>>([])
  });

  get basicControls() {
    return this.form.controls.general.controls;
  }

  get linkControls() {
    return this.form.controls.linksAndContacts.controls.links.controls;
  }

  get phoneControls() {
    return this.form.controls.linksAndContacts.controls.phoneNumbers.controls;
  }

  getSamplePhoneNumber(code: string) {
    const p =  phoneUtil.getExampleNumber(code);
    return phoneUtil.format(p, PhoneNumberFormat.NATIONAL);
  }

  ngAfterViewInit(): void {
    this.form.patchValue({})
  }

  addLinkControl() {
    this.form.controls.linksAndContacts.controls.links.push(newLinkControl());
  }

  removeLinkControl(index: number) {
    this.form.controls.linksAndContacts.controls.links.removeAt(index);
  }

  addPhoneControl() {
    this.form.controls.linksAndContacts.controls.phoneNumbers.push(newPhoneControl(this.form.controls.linksAndContacts.controls.phoneNumbers.at(-1)?.value.code ?? 'CM'));
  }

  removePhoneControl(index: number) {
    this.form.controls.linksAndContacts.controls.phoneNumbers.removeAt(index);
  }

  addEmailControl() {
    this.form.controls.linksAndContacts.controls.emails.push(newEmailControl());
  }

  removeEmailControl(index: number) {
    this.form.controls.linksAndContacts.controls.emails.removeAt(index);
  }

  constructor() {
    this.form.controls.linksAndContacts.controls.links.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(values => {
      if (!values.every(v => (v?.length ?? 0) > 0)) return;
      this.addLinkControl();
    });

    this.form.controls.linksAndContacts.controls.phoneNumbers.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(values => {
      if (!values.every(v => (v.number?.length ?? 0) > 0)) return;
      this.addPhoneControl();
    })
    this.form.controls.linksAndContacts.controls.emails.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(values => {
      if (!values.every(v => v.length > 0)) return;
      this.addEmailControl();
    });
  }
}
