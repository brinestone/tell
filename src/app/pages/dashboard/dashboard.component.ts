import { Component }                 from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Card }                      from 'primeng/card';

@Component({
  selector: 'tm-dashboard',
  imports: [
    CurrencyPipe,
    PercentPipe,
    Card
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
