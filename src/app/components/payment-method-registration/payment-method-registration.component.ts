import { Component } from '@angular/core';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MomoComponent } from './momo/momo.component';
import { dispatch } from '@ngxs/store';
import { RefreshPaymentMethod } from '@app/state/user';

@Component({
  selector: 'tm-payment-method-registration',
  imports: [
    InputGroupModule,
    InputGroupAddonModule,
    MomoComponent
  ],
  templateUrl: './payment-method-registration.component.html',
  styleUrl: './payment-method-registration.component.scss'
})
export class PaymentMethodRegistrationComponent {
  private refreshPaymentMethods = dispatch(RefreshPaymentMethod);

  onMomoNumberPaymentMethodConnected() {
    this.refreshPaymentMethods();
  }
}
