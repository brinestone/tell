import { Component }          from '@angular/core';
import { Panel }              from 'primeng/panel';
import { Divider }            from 'primeng/divider';
import { Button }             from 'primeng/button';
import { PrefsFormComponent } from '@app/components/prefs-form/prefs-form.component';

@Component({
  selector: 'tm-settings',
  imports: [
    Panel,
    Divider,
    Button,
    PrefsFormComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

}
