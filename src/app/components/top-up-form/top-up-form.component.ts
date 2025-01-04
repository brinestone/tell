import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';

@Component({
  selector: 'tm-top-up-form',
  imports: [
    Select,
    Fluid,
    InputNumber,
    ReactiveFormsModule,
    Button
  ],
  templateUrl: './top-up-form.component.html',
  styleUrl: './top-up-form.component.scss'
})
export class TopUpFormComponent {
  readonly form = new FormGroup({
    paymentMethod: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl('XAF', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] })
  });

  // Resources

}
