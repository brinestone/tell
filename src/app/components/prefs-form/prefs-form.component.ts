import { Component, effect, inject }                               from '@angular/core';
import { Select }                                                  from 'primeng/select';
import { rxResource }                                              from '@angular/core/rxjs-interop';
import { HttpClient }                                              from '@angular/common/http';
import { CountryData, Currency, Language }                         from '@lib/country-data';
import { distinct, from, mergeMap, of, toArray }                   from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserPrefs }                                               from '@lib/user';
import { Button }                                                  from 'primeng/button';

@Component({
  selector: 'tm-prefs-form',
  imports: [
    Select,
    ReactiveFormsModule,
    Button
  ],
  templateUrl: './prefs-form.component.html',
  styleUrl: './prefs-form.component.scss'
})
export class PrefsFormComponent {
  private http = inject(HttpClient);
  readonly countries = rxResource({
    loader: () => this.http.get<CountryData[]>('/api/countries')
  });
  readonly currentCountry = rxResource({
    loader: () => this.http.get<CountryData>('/api/countries/mine')
  });
  readonly languages = rxResource({
    request: () => ({ countries: this.countries.value() }),
    loader: ({ request: { countries } }) => {
      if (!countries) return of(Array<Language>());
      return from(countries).pipe(
        mergeMap(country => country.languages),
        distinct(l => l.iso639_2),
        toArray()
      )
    }
  });
  readonly currencies = rxResource({
    request: () => ({ countries: this.countries.value() }),
    loader: ({ request: { countries } }) => {
      if (!countries) return of(Array<Currency>());
      return from(countries).pipe(
        mergeMap(country => country.currencies ?? []),
        distinct(c => c.code),
        toArray()
      )
    }
  });
  readonly currentPrefs = rxResource({
    loader: () => this.http.get<UserPrefs>('/api/users/prefs')
  })
  readonly themeOptions = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' }, {
      label: 'System',
      value: 'system'
    }
  ];
  readonly form = new FormGroup({
    theme: new FormControl<'light' | 'dark' | 'system'>('system', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    country: new FormControl('US', { nonNullable: true, validators: [Validators.required] }),
    language: new FormControl('en', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl('USD', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const prefs = this.currentPrefs.value();
      if (!prefs) return;
      const { country, currency, theme, language } = prefs;
      this.form.patchValue({
        country, currency, theme: theme ?? 'light', language
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  onFormSubmit() {

  }
}
