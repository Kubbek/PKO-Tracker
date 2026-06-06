# PKO Bounty Tracker

## Krok 1 – Supabase (już zrobione)
Klucze są wbudowane w `src/lib/supabase.js`.

Wejdź w **Supabase → SQL Editor**, wklej i uruchom zawartość pliku `supabase_schema.sql`.

## Krok 2 – GitHub
1. Utwórz nowe repozytorium na github.com (np. `pko-tracker`)
2. Wgraj wszystkie pliki z tego folderu

## Krok 3 – Netlify
1. Wejdź na netlify.com → "Add new site" → "Import from Git"
2. Wybierz repozytorium `pko-tracker`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Kliknij Deploy

## Widoki
- `/` → ekran logowania
- **TD** (hasło: `td2024`) – pełna kontrola turnieju
- **Dealer** (hasło: `dealer2024`) – widok stołu, zgłaszanie eliminacji
- **Gracz/Widz** – live feed bez hasła

## Zmiana haseł
Edytuj `src/App.jsx`, linia:
```js
const PASSWORDS = { td: 'td2024', dealer: 'dealer2024' }
```
