import { Component, inject, OnInit, output, signal }               from '@angular/core';
import { Select }                                                  from 'primeng/select';
import { rxResource }                                              from '@angular/core/rxjs-interop';
import { HttpClient }                                              from '@angular/common/http';
import { CountryData, Currency, Language }                         from '@lib/models/country-data';
import { distinct, from, mergeMap, of, toArray }                   from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserPrefs }                                               from '@lib/models/user';
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
export class PrefsFormComponent implements OnInit {
  private http = inject(HttpClient);
  readonly submitting = signal(false);
  readonly loadingPrefs = signal(false);
  readonly countries = rxResource({
    loader: () => this.http.get<CountryData[]>('/api/countries')
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
  readonly error = output<Error>();

  ngOnInit() {
    this.loadingPrefs.set(true);
    this.http.get<UserPrefs>('/api/users/prefs').subscribe({
      complete: () => this.loadingPrefs.set(false),
      error: (error: Error) => {
        this.error.emit(error);
        this.loadingPrefs.set(false);
      },
      next: ({ language, currency, theme, country }) => {
        this.form.patchValue({
          language, currency, theme, country
        });
        this.form.markAsUntouched();
        this.form.markAsPristine();
      }
    })
  }

  onFormSubmit() {
    this.submitting.set(true);
    this.http.put<UserPrefs>('/api/users/prefs', this.form.value)
      .subscribe({
        error: (error: Error) => {
          this.submitting.set(false);
          this.error.emit(error);
        },
        next: ({ language, currency, theme, country }) => {
          this.form.patchValue({
            language, currency, theme, country
          });
          this.form.markAsUntouched();
          this.form.markAsPristine();
        },
        complete: () => this.submitting.set(false)
      })
  }
}
