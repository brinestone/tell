import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Campaign }                                                   from '@lib/models/campaign';
import { Fluid }                                                      from 'primeng/fluid';
import { Select }                                                     from 'primeng/select';
import { InputNumberModule }                                          from 'primeng/inputnumber';
import { DatePicker }                                                 from 'primeng/datepicker';
import { FormControl, FormGroup, ReactiveFormsModule, Validators }    from '@angular/forms';
import { DatePipe, DecimalPipe }                                      from '@angular/common';
import { Button }                                                     from 'primeng/button';
import { RouterLink }                                                 from '@angular/router';
import { Message }                                                    from 'primeng/message';
import { HttpClient, HttpErrorResponse }                              from '@angular/common/http';

@Component({
  selector: 'tm-publication-form',
  imports: [
    Fluid,
    Select,
    DatePicker,
    ReactiveFormsModule,
    DecimalPipe,
    Button,
    RouterLink,
    InputNumberModule,
    DatePipe,
    Message
  ],
  templateUrl: './publication-form.component.html',
  styleUrl: './publication-form.component.scss'
})
export class PublicationFormComponent {
  private http = inject(HttpClient);
  readonly today = signal(new Date());
  publishAfterMin = new Date();
  publishBeforeMin = new Date(Date.now() + 86_400_000);
  readonly campaign = input<number>();
  readonly campaigns = input.required<Campaign[]>();
  readonly campaignsLoading = input<boolean>();
  readonly campaignLookup = computed(() => this.campaigns().find(({ id }) => id == this.campaign()))
  readonly totalTokens = input.required<number>();
  readonly errorMessage = signal('');
  readonly submitting = signal(false);
  readonly onSubmit = output();
  readonly form = new FormGroup({
    campaign: new FormControl<number | null>(null, [Validators.required]),
    tokens: new FormControl<number | null>(0),
    publishBefore: new FormControl<Date | null>(null),
    publishAfter: new FormControl<Date | null>(new Date())
  });

  constructor() {
    this.form.valueChanges.subscribe({
      next: ({ publishAfter }) => {
        this.publishBeforeMin = new Date((publishAfter ?? new Date()).valueOf() + 86_400_000);
      }
    })
    effect(() => {
      this.form.patchValue({
        campaign: this.campaign(),
        publishAfter: this.today()
      });
      this.form.controls.tokens.setValidators([Validators.required, Validators.min(1), Validators.max(this.totalTokens())])
      this.form.markAsUntouched();
      this.form.markAsPristine();
    });
  }

  onFormSubmit() {
    this.errorMessage.set('');
    this.submitting.set(true);
    const { campaign, tokens, publishBefore, publishAfter } = this.form.value;
    this.http.post(`/api/campaigns/${campaign}/publications`, {
      campaign,
      tokens,
      publishBefore,
      publishAfter
    }).subscribe({
      error: ({ error, message }: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(error?.message ?? message);
      },
      complete: () => {
        this.submitting.set(false);
        this.errorMessage.set('');
        this.form.reset();
        this.onSubmit.emit();
      }
    });
  }
}
