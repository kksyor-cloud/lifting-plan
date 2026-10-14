# Lifting Plan (리프팅 플랜)

A pre-lift review app for mobile cranes. Expo SDK 57, React Native, TypeScript, Expo Router. The app UI is in Korean.

> The equipment catalog holds real specs for 292 models up to 200 t from five makers (KATO, LIEBHERR, TADANO, GROVE, KOBELCO) in `src/data/catalog.json`.
> Lift calculations use only the 15 models with a registered load chart (Tadano GR-N ×5, Tadano GR-EX ×5, Kato SR ×5). The charts were extracted from the makers' official PDFs and **have not been checked cell by cell against the originals**. Do not use the results for an actual lift without checking the manufacturer's load chart.

## Updating equipment data

```bash
python3 scripts/sync-catalog.py   # /mnt/project-files/catalog/cranes.json -> src/data/catalog.json
```

Any catalog entry with a `chart` automatically becomes a crane the review calculation can use (`toCrane` in `src/lib/cranes.ts`). Boom pivot height is an estimate derived from the crane class.

## Running

```bash
npm install
npx expo start        # scan the QR code with Expo Go, or press w for web
npm test              # calculation tests
npm run typecheck
```

An Android APK is built by GitHub Actions (`.github/workflows/android-apk.yml`) and published to the `apk-latest` release. It is signed with the debug key, so it is for direct install only, not for the Play Store.

## Structure

```
src/
  app/                   screens (Expo Router)
    index.tsx            home
    review/input.tsx     1. conditions: building height, load weight, optional load size and sling angle
    review/settings.tsx  2. crane settings: UP/DN, max-reach auto calc, setback and radius sliders with locks
    review/result.tsx    3. review report
    history.tsx          saved reviews
    equipment/           equipment catalog (filters, search, model detail)
  lib/
    calc.ts              lift calculation (pure functions, tested)
    catalog.ts           equipment catalog (292 models, filters)
    cranes.ts            cranes used by the calculation (models with a load chart)
    ground.ts            outrigger reaction and ground bearing check
    report.ts            review report HTML for PDF export
    review-context.tsx   single state for one review
    history.ts           saved reviews (AsyncStorage)
  components/            shared UI, side-view diagram, crane mark
  theme.ts               brand tokens (yellow, charcoal)
```

## How the calculation works

The review flow follows the Crane Fit app: enter the fixed conditions, then position the crane.

- Working radius R = setback (crane center to building wall) + reach (wall to lift point)
- Required tip height = building height + 1.0 m + (load height + sling height, 2.5 m if no size is given) + 2.0 m
- For each crane, find the shortest boom (0.1 m steps) that satisfies the boom angle range, the tip height, and at least 1.0 m clearance from the building edge
- Rated capacity comes from the load chart cell with the same or longer boom and the same or larger radius (conservative)
- Load ratio = (load + rigging + hook block) / rated capacity. Up to 80% is OK, up to 100% is caution, above 100% is not possible
- UP / DN switches to the next larger or smaller crane class
- Max-reach auto calc searches setback and radius in 0.5 m steps for the longest reach that is still OK (caution is allowed only if nothing is OK). Locked values are kept
- Sling: two legs, tension per leg = load / (2 · sin angle)
- Outrigger reaction (simplified): max reaction = 75% × (crane weight + hook load), ground pressure = reaction / pad area, caution above 80% of the allowable bearing capacity
- Review report PDF: "PDF 내보내기" on the result screen (share sheet on the phone, print dialog on the web)
- Only the inputs are saved; results are recalculated with the same logic every time a review is opened

## Next

- Check the load charts against the original PDFs, and add charts for more models
- Mobile tower cranes
- Outrigger reaction from the manufacturers' reaction tables (currently a 75% estimate)
