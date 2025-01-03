import { Component, computed, effect, input, output, signal }      from '@angular/core';
import { Campaign }                                                from '@lib/campaign';
import { Fluid }                                                   from 'primeng/fluid';
import { Select }                                                  from 'primeng/select';
import { InputNumberModule }                                       from 'primeng/inputnumber';
import { DatePicker }                                              from 'primeng/datepicker';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe }                                   from '@angular/common';
import { Button }                                                  from 'primeng/button';
import { RouterLink }                                              from '@angular/router';
import { Message }                                                 from 'primeng/message';

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
  readonly today = signal(new Date());
  publishAfterMin = new Date();
  publishBeforeMin = new Date(Date.now() + 86_400_000);
  readonly campaign = input<number>();
  readonly campaigns = input.required<Campaign[]>();
  readonly campaignsLoading = input<boolean>();
  readonly campaignLookup = computed(() => this.campaigns().find(({ id }) => id == this.campaign()))
  readonly totalTokens = input.required<number>();
  readonly errorMessage = signal('');
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

  }
}
