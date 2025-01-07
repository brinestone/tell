import { Component } from '@angular/core';
import { Panel } from 'primeng/panel';
import { Divider } from 'primeng/divider';
import { Button } from 'primeng/button';
import { PrefsFormComponent } from '@app/components/prefs-form/prefs-form.component';
import { ConnectionsFormComponent } from '@app/components/connections-form/connections-form.component';
import { PaymentMethodRegistrationComponent } from "@app/components/payment-method-registration/payment-method-registration.component";

@Component({
  selector: 'tm-settings',
  imports: [
    Panel,
    Divider,
    Button,
    PrefsFormComponent,
    ConnectionsFormComponent,
    PaymentMethodRegistrationComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

}
