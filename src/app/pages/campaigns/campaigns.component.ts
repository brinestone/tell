import { Component, computed, effect, inject, model, ResourceRef, signal }    from '@angular/core';
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
import { DatePipe, NgTemplateOutlet }                                         from '@angular/common';
import { MultiSelect }                                                        from 'primeng/multiselect';
import { MessageService }                                                     from 'primeng/api';
import { rxResource, takeUntilDestroyed }                                     from '@angular/core/rxjs-interop';
import { Select }                                                             from 'primeng/select';
import { PhoneNumberFormat, PhoneNumberUtil }                                 from 'google-libphonenumber';
import { FileRemoveEvent, FileSelectEvent, FileUpload, FileUploadEvent }      from 'primeng/fileupload';
import { PhoneDirective }                                                     from '@app/directives/phone.directive';
import { CountryData }                                                        from '@lib/country-data';
import { Category }                                                           from '@lib/category';
import { HttpClient, HttpErrorResponse, HttpResponse }                        from '@angular/common/http';
import { MeterGroup }                                                         from 'primeng/metergroup';
import { Divider }                                                            from 'primeng/divider';
import { LookupCampaingsResponse }                                            from '@lib/campaign';

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
    PhoneDirective,
    FileUpload,
    MeterGroup,
    Divider,
    DatePipe
  ],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.scss'
})
export class CampaignsComponent {
  private messageService = inject(MessageService);
  private http = inject(HttpClient);
  showNewCampaignModal = model(false);
  newCampaignFormStep = model(1);
  currentPage = model(0);
  currentPageSize = model(20);
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
  }])

  readonly categories = rxResource({
    loader: () => this.http.get<Category[]>('/api/categories')
  });
  readonly countries = rxResource({
    loader: () => this.http.get<CountryData[]>('/api/countries/all')
  });

  readonly campaigns: ResourceRef<LookupCampaingsResponse> = rxResource({
    request: () => ({ page: this.currentPage(), size: this.currentPageSize() }),
    loader: ({ request: { page, size } }) => this.http.get<LookupCampaingsResponse>('/api/campaigns', {
      params: {
        page,
        size
      }
    })
  });

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
      error: (error: HttpErrorResponse) => this.messageService.add({
        summary: 'Error',
        detail: error.error?.message ?? error.message,
        severity: 'error',
      }),
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
        this.showNewCampaignModal.set(false);
        this.newCampaignFormStep.set(1);
        this.campaigns.reload();
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
