import { Component }   from '@angular/core';
import { Card }        from 'primeng/card';
import { DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Panel }       from 'primeng/panel';
import { Button }      from 'primeng/button';

@Component({
  selector: 'tm-wallet',
  imports: [
    Card,
    DecimalPipe,
    TableModule,
    Panel,
    Button
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class WalletComponent {

}
