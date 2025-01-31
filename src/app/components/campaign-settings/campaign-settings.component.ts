import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, NgPlural, NgPluralCase, NgTemplateOutlet } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, effect, inject, input, output, signal, viewChildren } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneDirective } from '@app/directives/phone.directive';
import { phoneValidator } from '@app/util/phone-valiator';
import { environment } from '@env/environment.development';
import { Campaign } from '@lib/models/campaign';
import { Category } from '@lib/models/category';
import { CountryData } from '@lib/models/country-data';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { get, isEqual } from 'lodash';
import { AccordionModule, } from 'primeng/accordion';
import { ConfirmationService, MessageService, ToastMessageOptions } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Divider } from 'primeng/divider';
import { Fieldset } from 'primeng/fieldset';
import { FileUpload, FileUploadErrorEvent, FileUploadEvent } from 'primeng/fileupload';
import { Inplace } from 'primeng/inplace';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { map } from 'rxjs';
const phoneUtil = PhoneNumberUtil.getInstance();

function isImageOrVideoUrl(url: string): "image" | "video" | null {
  const lowerCaseUrl = url.toLowerCase();

  const imageExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".tiff", ".tif",
  ];
  for (const ext of imageExtensions) {
    if (lowerCaseUrl.endsWith(ext)) {
      return "image";
    }
  }

  const videoExtensions = [
    ".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm", ".mkv", ".mpeg", ".mpg",
  ];
  for (const ext of videoExtensions) {
    if (lowerCaseUrl.endsWith(ext)) {
      return "video";
    }
  }

  return null;
}

function newAttachmentControl(url: string) {
  return new FormControl<string>(url, { nonNullable: true });
}

function newEmailControl(value = '') {
  return new FormControl<string>(value, {
    nonNullable: true,
    validators: [Validators.maxLength(100), Validators.email]
  });
}

function newPhoneControl(defaultCode = 'CM', number?: string) {
  return new FormGroup({
    code: new FormControl<string>(defaultCode, {
      nonNullable: true,
    }),
    number: new FormControl(number, { nonNullable: false })
  }, [phoneValidator()]);
}

function newLinkControl(value = '') {
  return new FormControl(value, [Validators.pattern(/^((http|https|ftp):\/\/)?(([\w-]+\.)+[\w-]+)(:\d+)?(\/[\w-]*)*(\?[\w-=&]*)?(#[\w-]*)?$/)])
}

@Component({
  providers: [MessageService, ConfirmationService],
  selector: 'tm-campaign-settings',
  imports: [Divider, ConfirmDialog, AsyncPipe, Toast, PhoneDirective, FileUpload, Select, NgTemplateOutlet, ReactiveFormsModule, Message, AccordionModule, Fieldset, Textarea, Inplace, InputText, Button, MultiSelect, NgPlural, NgPluralCase],
  templateUrl: './campaign-settings.component.html',
  styleUrl: './campaign-settings.component.scss'
})
export class CampaignSettings {
  readonly isSmallDisplay = inject(BreakpointObserver).observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape]).pipe(map(({ matches }) => matches))
  private pendingToastMessageVisible = false;
  private inPlaceControls = viewChildren(Inplace);
  readonly uploading = signal(false);
  readonly updating = signal(false);
  readonly deleting = signal(false);
  private http = inject(HttpClient);
  readonly updated = output();
  readonly deleted = output();
  readonly error = output<Error>();
  readonly campaign = input<Campaign>();
  readonly categories = rxResource({
    loader: () => this.http.get<Category[]>(environment.apiOrigin + '/categories')
  });
  readonly countries = rxResource({
    loader: () => this.http.get<CountryData[]>(environment.apiOrigin + '/countries')
  });
  readonly form = new FormGroup({
    general: new FormGroup({
      title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      categories: new FormControl<number[]>([], { nonNullable: true, validators: [] }),
      description: new FormControl<string | null>(null, []),
      redirectUrl: new FormControl('', { validators: [Validators.pattern(/^((http|https|ftp):\/\/)?(([\w-]+\.)+[\w-]+)(:\d+)?(\/[\w-]*)*(\?[\w-=&]*)?(#[\w-]*)?$/)] })
    }),
    linksAndContacts: new FormGroup({
      links: new FormArray<FormControl<string | null>>([newLinkControl()]),
      phones: new FormArray<FormGroup<{
        code: FormControl<string>;
        number: FormControl<string | null | undefined>;
      }>>([newPhoneControl()]),
      emails: new FormArray<FormControl<string>>([newEmailControl()])
    }),
    media: new FormArray<FormControl<string>>([])
  });

  get origin() {
    return environment.apiOrigin;
  }

  get emails() {
    return this.form.controls.linksAndContacts.controls.emails;
  }

  get emailControls() {
    return this.form.controls.linksAndContacts.controls.emails.controls;
  }

  get general() {
    return this.form.controls.general;
  }

  get modifiedGeneralOutput() {
    return Object.entries(this.general.controls).filter(([_, c]) => c.dirty)
      .reduce((acc, [k, c]) => {
        let v = c.value;
        if (typeof v == 'string') {
          v = v.trim();
        }
        acc[k] = v;
        return acc;
      }, {} as Record<string, string | number[] | null>);
  }

  get modifiedLinksAndContactsOutput() {
    const ans = {
      links: this.links.value.slice(0, this.linkControls.length - 1),
      emails: this.emails.value.slice(0, this.emails.length - 1),
      phones: this.phones.value.slice(0, this.phones.length - 1)
        .map(({ code, number }) => phoneUtil.parse(number ?? undefined, code))
        .map(p => phoneUtil.format(p, PhoneNumberFormat.E164))
    } as Record<string, any>;

    if (ans['links'].length == 0 || isEqual(ans['links'], this.campaign()?.links ?? []))
      delete ans['links'];

    if (ans['emails'].length == 0 || isEqual(ans['emails'], this.campaign()?.emails ?? []))
      delete ans['emails'];

    if (ans['phones'].length == 0 || isEqual(ans['phones'], this.campaign()?.phones ?? []))
      delete ans['phones'];

    return ans;
  }

  get attachmentsOutput() {
    const ans = { media: this.attachments.value } as Record<string, string[]>;
    if (ans['media'].length == 0 || isEqual(ans['media'], this.campaign()?.media ?? []))
      delete ans['media'];

    return ans;
  }

  get generalControls() {
    return this.form.controls.general.controls;
  }

  get links() {
    return this.form.controls.linksAndContacts.controls.links;
  }

  get linkControls() {
    return this.form.controls.linksAndContacts.controls.links.controls;
  }

  get phones() {
    return this.form.controls.linksAndContacts.controls.phones;
  }

  get phoneControls() {
    return this.form.controls.linksAndContacts.controls.phones.controls;
  }

  get attachments() {
    return this.form.controls.media;
  }

  get attachmentControls() {
    return this.attachments.controls;
  }

  getCategory(id: number) {
    return this.categories.value()?.find(c => c.id == id);
  }

  getAttachmentType(url: string) {
    return isImageOrVideoUrl(url);
  }

  getSamplePhoneNumber(code: string) {
    const p = phoneUtil.getExampleNumber(code);
    return phoneUtil.format(p, PhoneNumberFormat.NATIONAL);
  }

  onBeforeUpload() {
    this.uploading.set(true);
  }

  onUploadFailed(event: FileUploadErrorEvent) {
    this.uploading.set(false);
  }

  onAttachmentFileUploaded(ev: FileUploadEvent) {
    this.uploading.set(false);
    const { body } = ev.originalEvent as HttpResponse<[string]>;

    if (!body) return;
    const [url] = body;

    const control = newAttachmentControl(url);
    this.attachments.insert(0, control);
    control.markAsTouched();
    control.markAsDirty();
    this.attachments.updateValueAndValidity();
  }

  private doResetForm(input?: Campaign) {
    this.links.clear();
    this.emails.clear();
    this.phones.clear();
    this.attachments.clear();

    this.form.patchValue({
      general: {
        title: input?.title,
        categories: input?.categories ?? [],
        description: input?.description,
        redirectUrl: input?.redirectUrl ?? null
      },
      media: input?.media
    });

    input?.links?.forEach((l, i) => this.addLinkControl(l, i));
    input?.emails?.forEach((e, i) => this.addEmailControl(e, i));
    input?.phones?.map(p => phoneUtil.parseAndKeepRawInput(p))
      .map(p => ({ code: phoneUtil.getRegionCodeForNumber(p), number: phoneUtil.format(p, PhoneNumberFormat.NATIONAL) }))
      .forEach(({ code, number }, i) => this.addPhoneControl(code, number, i));
    input?.media?.forEach((m, i) => {
      this.attachments.insert(i, newAttachmentControl(m));
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.form.updateValueAndValidity();
    this.inPlaceControls().forEach(i => i.deactivate());
  }

  revertControl(campaignObjKey: string, control: AbstractControl, callback: () => void) {
    const value = get(this.campaign(), campaignObjKey)
    control.patchValue(value);
    control.markAsPristine();
    control.markAsUntouched();
    control.updateValueAndValidity();
    callback();
  }

  addLinkControl(value?: string, index?: number) {
    if (index !== undefined)
      this.links.insert(index, newLinkControl(value));
    else
      this.links.push(newLinkControl(value));
  }

  removeLinkControl(index: number) {
    this.form.controls.linksAndContacts.controls.links.removeAt(index);
    if (isEqual(this.links.value, this.campaign()?.links ?? [])) {
      this.links.markAsUntouched();
      this.links.markAsPristine();
    } else if (!isEqual(this.links.value, this.campaign()?.links ?? [])) {
      this.links.markAsDirty();
      this.links.markAsTouched();
    }
    this.links.updateValueAndValidity();
  }

  addPhoneControl(code?: string, number?: string, index?: number) {
    if (index !== undefined)
      this.phones.insert(index, newPhoneControl(code ?? this.phones.at(-1)?.value.code ?? 'CM', number));
    else this.phones.push(newPhoneControl(code ?? this.phones.at(-1)?.value.code ?? 'CM', number));
  }

  removePhoneControl(index: number) {
    this.phones.removeAt(index);
    const phones = this.phones.value.slice(0, this.phones.length - 1)
      .map(({ code, number }) => {
        return phoneUtil.parse(number ?? undefined, code ?? undefined);
      }).map(p => phoneUtil.format(p, PhoneNumberFormat.E164));

    if (isEqual(phones, this.campaign()?.phones ?? [])) {
      this.phones.markAsUntouched();
      this.phones.markAsPristine();
    } else if (!isEqual(phones, this.campaign()?.phones ?? [])) {
      this.phones.markAsTouched();
      this.phones.markAsDirty();
    }
    this.phones.updateValueAndValidity();
  }

  addEmailControl(value?: string, index?: number) {
    if (index !== undefined)
      this.emails.insert(index, newEmailControl(value));
    else
      this.emails.push(newEmailControl(value));
  }

  removeEmailControl(index: number) {
    this.emails.removeAt(index);
    if (isEqual(this.emails.value, this.campaign()?.emails ?? [])) {
      this.emails.markAsUntouched();
      this.emails.markAsPristine();
    } else if (!isEqual(this.emails.value, this.campaign()?.emails ?? [])) {
      this.emails.markAsDirty();
      this.emails.markAsTouched();
    }
    this.links.updateValueAndValidity();
  }

  removeAttachmentControl(index: number) {
    this.attachments.removeAt(index);
    if (isEqual(this.attachments.value, this.campaign()?.media ?? [])) {
      this.attachments.markAsPristine();
      this.attachments.markAsUntouched();
    } else if (!isEqual(this.attachments.value, this.campaign()?.media ?? [])) {
      this.attachments.markAsDirty();
      this.attachments.markAsTouched();
    }
    this.attachments.updateValueAndValidity();
  }

  onFormSubmit() {
    this.doSubmitForm();
  }

  onSubmitButtonClicked() {
    this.doSubmitForm();
  }

  private doSubmitForm() {
    this.updating.set(true);
    const request = {
      ...this.attachmentsOutput,
      ...this.modifiedGeneralOutput,
      ...this.modifiedLinksAndContactsOutput
    };

    this.http.patch(`${environment.apiOrigin}/campaign/${this.campaign()?.id}`, request).subscribe({
      error: (error: HttpErrorResponse) => {
        this.ms.add({
          severity: 'error',
          summary: 'Submission error',
          detail: error.error?.message ?? error.message,
          key: 'pending-campaign-changes',
        });
        this.updating.set(false);
      },
      complete: () => {
        this.updating.set(false);
        this.ms.clear('pending-campaign-changes');
        this.pendingToastMessageVisible = false;
        this.updated.emit();
      }
    })
  }

  onResetButtonClicked() {
    this.doResetForm(this.campaign());
  }

  onDeleteCampaignButtonClicked(event: MouseEvent) {
    this.cs.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to proceed? This process cannot be undone',
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        text: true,
        size: 'small',
        rounded: true
      },
      acceptButtonProps: {
        label: 'Yes',
        severity: 'danger',
        size: 'small',
        rounded: true
      },
      accept: () => {
        this.doDeleteCampaign();
      }
    })
  }

  private doDeleteCampaign() {
    this.deleting.set(true);
    this.http.delete(`${environment.apiOrigin}/campaign/${this.campaign()?.id}`).subscribe({
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.error.emit(error?.error ?? error);
      },
      complete: () => {
        this.deleting.set(false);
        this.deleted.emit();
      }
    })
  }

  constructor(private ms: MessageService, private cs: ConfirmationService) {
    effect(() => {
      const value = this.campaign();
      this.doResetForm(value);
    });

    this.links.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(values => {
      if (!values.every(v => (v?.length ?? 0) > 0)) return;
      this.addLinkControl();
    });

    this.phones.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(values => {
      if (!values.every(v => (v.number?.length ?? 0) > 0)) return;
      this.addPhoneControl();
    });

    this.emails.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(values => {
      if (!values.every(v => v.length > 0)) return;
      this.addEmailControl();
    });

    this.form.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(() => {
      // const linksAndContactsPristine = this.linkControls.length == 1 && this.emailControls.length == 1 && this.phoneControls.length == 1;
      const toastKey = 'pending-campaign-changes';

      if (this.general.pristine && this.links.pristine && this.emails.pristine && this.phones.pristine && this.attachments.pristine) {
        this.pendingToastMessageVisible = false;
        ms.clear(toastKey);
        return;
      }

      if (this.pendingToastMessageVisible) return;
      const toastId = 'pending-changes';
      const toastMessage: ToastMessageOptions = {
        sticky: true,
        id: toastId,
        severity: 'info',
        closable: false,
        detail: 'Save pending changes?',
        key: toastKey
      }
      ms.add(toastMessage);
      this.pendingToastMessageVisible = true;
    })
  }
}
