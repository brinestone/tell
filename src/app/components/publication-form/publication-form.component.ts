import { Component, effect, inject, input, output, signal } from '@angular/core';
import { Campaign } from '@lib/models/campaign';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DatePicker } from 'primeng/datepicker';
import { Tooltip } from 'primeng/tooltip';
import { Fluid } from 'primeng/fluid';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { DecimalPipe, PercentPipe } from '@angular/common';

@Component({
  selector: 'tm-publication-form',
  imports: [
    ReactiveFormsModule,
    InputNumberModule,
    DatePicker,
    Tooltip,
    Fluid,
    Button,
    Message,
    PercentPipe,
    DecimalPipe
  ],
  templateUrl: './publication-form.component.html',
  styleUrl: './publication-form.component.scss'
})
export class PublicationFormComponent {
  private http = inject(HttpClient);
  publishAfterMin = new Date();
  publishBeforeMin = new Date(Date.now() + 86_400_000);
  readonly campaign = input<Campaign>();
  readonly today = signal(new Date());
  readonly totalCredits = input.required<number>();

  readonly errorMessage = signal('');
  readonly submitting = signal(false);
  readonly onSubmit = output();
  readonly form = new FormGroup({
    credits: new FormControl<number | null>(null, [Validators.required, Validators.min(25)]),
    publishBefore: new FormControl<Date | null>(null),
    publishAfter: new FormControl<Date | null>(new Date())
  })

  constructor() {
    this.form.valueChanges.subscribe({
      next: ({ publishAfter }) => {
        this.publishBeforeMin = new Date((publishAfter ?? new Date()).valueOf() + 86_400_000);
      }
    })
    effect(() => {
      this.form.patchValue({
        publishAfter: this.today()
      });
      this.form.controls.credits.setValidators([Validators.required, Validators.min(25), Validators.max(this.totalCredits())])
      this.form.markAsUntouched();
      this.form.markAsPristine();
    });
  }

  onFormSubmit() {
    this.errorMessage.set('');
    this.submitting.set(true);
    const { credits, publishBefore, publishAfter } = this.form.value;
    this.http.post(`/api/campaign/publications/${this.campaign()?.id}`, {
      credits,
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
