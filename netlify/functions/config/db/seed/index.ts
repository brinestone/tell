import * as categories          from './categories';
import { concatMap, from, map } from 'rxjs';
import {config} from 'dotenv'

config();

type Seeder = { name: string, seed: () => Promise<void> }
const seeders: Seeder[] = [categories];

from(seeders).pipe(
  concatMap(({ seed, name }) => {
    return from(seed()).pipe(
      map(() => name)
    );
  })
).subscribe({
  next: (name) => console.log(`Seeded "${name}" model`),
  error: (error: Error) => console.log(error)
});
