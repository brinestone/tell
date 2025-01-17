import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, inject, output, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Button } from "primeng/button";
import { Fluid } from "primeng/fluid";
import { InputText } from "primeng/inputtext";
import { Message } from "primeng/message";

@Component({
  selector: 'tm-campaign-form',
  templateUrl: './campaign-form.component.html',
  styleUrl: './campaign-form.component.scss',
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
    Fluid,
    Message
  ]
})
export class CampaignFormComponent {
  private http = inject(HttpClient);
  submitting = signal(false);
  onSubmitted = output();
  onErrored = output<Error>();
  form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });

  onCreateCampaignButtonClicked() {
    this.submitting.set(true);
    const val = this.form.value;
    this.http.post('/api/campaigns', val).subscribe({
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.onErrored.emit(error.error ?? error);
      },
      complete: () => {
        this.onSubmitted.emit();
      }
    });
  }

  onFormSubmit(event: SubmitEvent) {
    event.preventDefault();
  }
}
