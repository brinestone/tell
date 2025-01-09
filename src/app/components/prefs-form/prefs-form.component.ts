import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { preferences, PrefsUpdated, UpdatePrefs } from '@app/state/user';
import { CountryData, Currency, Language } from '@lib/models/country-data';
import { Actions, dispatch, ofActionCompleted, ofActionDispatched, select } from '@ngxs/store';
import { Select } from 'primeng/select';
import { distinct, filter, from, map, merge, mergeMap, of, tap, toArray } from 'rxjs';

@Component({
  selector: 'tm-prefs-form',
  imports: [
    Select,
    ReactiveFormsModule
  ],
  templateUrl: './prefs-form.component.html',
  styleUrl: './prefs-form.component.scss'
})
export class PrefsFormComponent implements OnInit {
  private http = inject(HttpClient);
  private prefsUpdated = dispatch(PrefsUpdated);
  private updatePrefs = dispatch(UpdatePrefs);
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
    { label: 'Light', value: 'light' },
  ];
  readonly form = new FormGroup({
    theme: new FormControl<'light' | 'dark' | 'system'>('light', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    country: new FormControl('US', { nonNullable: true, validators: [Validators.required] }),
    language: new FormControl('en', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl('USD', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly error = output<Error>();
  readonly currentPrefs = select(preferences);

  ngOnInit() {
    this.setConfiguredPreferences();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  private setConfiguredPreferences() {
    const { language, country, currency, theme } = this.currentPrefs();
    this.form.patchValue({
      language, currency, theme, country
    });
  }

  constructor(actions: Actions) {
    merge(
      actions.pipe(ofActionDispatched(UpdatePrefs), map(() => true)),
      actions.pipe(ofActionCompleted(UpdatePrefs), map(() => false))
    ).pipe(
      takeUntilDestroyed(),
      tap(() => {
        this.ngOnInit();
      })
    ).subscribe(v => this.submitting.set(v));

    this.form.valueChanges.pipe(
      takeUntilDestroyed(),
      filter(() => this.form.dirty),
      mergeMap(({ country, currency, language, theme }) => this.updatePrefs(theme!, country!, currency!, language!))
    ).subscribe({
      error: (error: Error) => {
        this.submitting.set(false);
        this.error.emit(error);
        this.setConfiguredPreferences();
      },
      complete: () => {
        this.submitting.set(false);
        this.prefsUpdated();
      }
    })
  }
}
