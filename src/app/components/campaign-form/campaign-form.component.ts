import { Component, computed, inject, input, model, output, signal }          from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Step, StepList, StepPanel, StepPanels, Stepper }                     from 'primeng/stepper';
import { Fluid }                                                              from 'primeng/fluid';
import { InputText }                                                          from 'primeng/inputtext';
import { Message }                                                            from 'primeng/message';
import { MultiSelect }                                                        from 'primeng/multiselect';
import { Button }                                                             from 'primeng/button';
import { Select }                                                             from 'primeng/select';
import { PhoneDirective }                                                     from '@app/directives/phone.directive';
import { FileRemoveEvent, FileSelectEvent, FileUpload, FileUploadEvent }      from 'primeng/fileupload';
import { MeterGroup }                                                         from 'primeng/metergroup';
import { HttpClient, HttpErrorResponse, HttpResponse }                        from '@angular/common/http';
import { PhoneNumberFormat, PhoneNumberUtil }                                 from 'google-libphonenumber';
import { takeUntilDestroyed }                                                 from '@angular/core/rxjs-interop';
import { Category }                                                           from '@lib/models/category';
import { Divider }                                                            from 'primeng/divider';
import { CountryData }                                                        from '@lib/models/country-data';
import { Textarea }                                                           from 'primeng/textarea';

function newMediaControl(url: string) {
  return new FormControl<string>(url, { nonNullable: true });
}

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

function newLinkControl() {
  return new FormControl('', [Validators.pattern(/^((http|https|ftp):\/\/)?(([\w-]+\.)+[\w-]+)(:\d+)?(\/[\w-]*)*(\?[\w-=&]*)?(#[\w-]*)?$/)])
}

const maxUploadSize = 6291456;

@Component({
  selector: 'tm-campaign-form',
  imports: [
    ReactiveFormsModule,
    Stepper,
    Fluid,
    StepList,
    Step,
    StepPanels,
    StepPanel,
    InputText,
    Message,
    MultiSelect,
    Button,
    Select,
    PhoneDirective,
    FileUpload,
    MeterGroup,
    Divider,
    Textarea
  ],
  templateUrl: './campaign-form.component.html',
  styleUrl: './campaign-form.component.scss'
})
export class CampaignFormComponent {
  private http = inject(HttpClient);
  newCampaignFormStep = model(1);
  selectedFiles = signal<File[]>([]);
  maxFileSize = computed(() => {
    const selected = this.selectedFiles();
    const totalSize = selected.reduce((a, b) => a + b.size, 0);
    return Math.max(maxUploadSize - totalSize, 0);
  });
  maxUploadCount = computed(() => {
    const maxSize = this.maxFileSize();
    return Math.floor(maxSize / (maxUploadSize / 10));
  });
  uploadConstraints = computed(() => [{
    label: 'Upload limit (6MB)',
    value: this.selectedFiles().reduce((acc, curr) => acc + curr.size, 0),
    color: 'var(--p-primary-color)'
  }]);
  readonly categories = input.required<Category[]>();
  readonly countries = input.required<CountryData[]>();
  readonly categoriesLoading = input(false);
  readonly countriesLoading = input(false);
  readonly error = output<Error>();
  readonly onSubmit = output();
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
      links: new FormArray<FormControl<string | null>>([newLinkControl()])
    }),
    media: new FormArray<FormControl<string>>([])
  });

  onMediaFileSelected(event: FileSelectEvent) {
    this.selectedFiles.update(() => [...event.currentFiles]);
  }

  onMediaFileRemoved(event: FileRemoveEvent) {
    this.selectedFiles.update(files => [...files.filter(f => f.name != event.file.name)]);
  }

  onMediaFilesUploaded({ originalEvent, files }: FileUploadEvent) {
    const { body } = originalEvent as HttpResponse<string[]>;
    if (!body) return;

    for (const url of body) {
      this.newCampaignForm.controls.media.insert(0, newMediaControl(url));
    }

    this.selectedFiles.update(current => {
      const ans = Array<File>();
      for (const file of current) {
        if (files.some(f => f.name === file.name)) continue;
        ans.push(file);
      }
      return ans;
    });
  }

  onMediaFilesCleared() {
    this.selectedFiles.set([]);
  }

  addEmailControl() {
    this.newCampaignForm.controls.contactsAndLinks.controls.emails.push(newEmailControl());
  }

  removeEmailControl(index: number) {
    this.newCampaignForm.controls.contactsAndLinks.controls.emails.removeAt(index);
  }

  addPhoneControl() {
    this.newCampaignForm.controls.contactsAndLinks.controls.phones.push(newPhoneControl(this.newCampaignForm.controls.contactsAndLinks.controls.phones.at(-1)?.value.code ?? 'CM'));
  }

  removePhoneControl(index: number) {
    this.newCampaignForm.controls.contactsAndLinks.controls.phones.removeAt(index);
  }

  addLinkControl() {
    this.newCampaignForm.controls.contactsAndLinks.controls.links.push(newLinkControl());
  }

  removeLinkControl(index: number) {
    this.newCampaignForm.controls.contactsAndLinks.controls.links.removeAt(index);
  }

  removeMediaControl(index: number) {
    this.newCampaignForm.controls.media.removeAt(index);
  }

  onFormSubmit(event: SubmitEvent) {
    event.preventDefault();
  }

  onFinishButtonClicked() {
    console.log(this.newCampaignForm.value);
    const { basic, media, contactsAndLinks } = this.newCampaignForm.value;
    const phoneUtil = PhoneNumberUtil.getInstance();
    this.http.post('/api/campaigns', {
      title: String(basic?.title),
      description: String(basic?.description),
      media: media ?? [],
      links: contactsAndLinks?.links?.filter(x => (x?.length ?? 0) > 0) ?? [],
      emails: contactsAndLinks?.emails?.filter(x => (x?.length ?? 0) > 0) ?? [],
      phones: contactsAndLinks?.phones?.filter((_, i, arr) => i < arr.length - 1).map(v => {
        const code = v.code ?? 'CM';
        const number = String(v.number);
        const phone = phoneUtil.parse(number, code);
        return phoneUtil.format(phone, PhoneNumberFormat.E164);
      }),
      categories: basic?.categories ?? []
    }).subscribe({
      error: (error: HttpErrorResponse) => this.error.emit(error),
      complete: () => {
        this.newCampaignForm.controls.contactsAndLinks.controls.links.clear();
        this.addLinkControl();
        this.newCampaignForm.reset()
        this.newCampaignForm.controls.contactsAndLinks.controls.emails.clear();
        this.addEmailControl();
        this.newCampaignForm.controls.contactsAndLinks.controls.phones.clear();
        this.addPhoneControl();
        this.newCampaignForm.controls.media.clear();
        this.selectedFiles.set([]);
        this.newCampaignForm.controls.basic.reset();
        this.newCampaignForm.reset();
        this.newCampaignFormStep.set(1);
        this.onSubmit.emit();
      }
    })
  }

  constructor() {
    this.newCampaignForm.controls.contactsAndLinks.controls.links.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(values => {
      if (!values.every(v => (v?.length ?? 0) > 0)) return;
      this.addLinkControl();
    })
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
  }
}
