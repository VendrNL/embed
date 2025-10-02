# Vendr Embed – gids voor beginners

Deze gids helpt je om de codebase snel te begrijpen als je net begint met webontwikkeling. We lopen door de belangrijkste mappen en bestanden, leggen uit wat er gebeurt wanneer de pagina laadt en geven tips voor wat je hierna kunt leren.

## 1. Hoe de mapstructuur in elkaar zit

```text
embed/
├── index.html            # De hoofdpagina die alles samenbrengt
├── assets/
│   ├── css/
│   │   ├── base.css      # Algemene opmaak voor de hele embed
│   │   ├── fonts.css     # Handige font-utilities per makelaar
│   │   └── themes/       # Groot aantal thema-bestanden (één per makelaar)
│   └── js/
│       └── app.js        # Alle interactieve logica in JavaScript
└── data/
    ├── realtors.json     # Overzicht van makelaars en hun instellingen
    └── realtor-*.json    # Dataset met objecten per makelaar
```

Belangrijk om te weten:

* **`index.html`** is het startpunt. Het laadt de basis-styles, zet een standaard thema klaar en include `assets/js/app.js` als module.
* **`assets/css/base.css`** bepaalt het algemene uiterlijk van de kaarten, knoppen en layout. De bestanden in `assets/css/themes/` overschrijven kleuren en fonts per makelaar.
* **`assets/js/app.js`** is een modern ES-module script dat de data ophaalt, filters toont en kaarten rendert.
* **`data/realtors.json`** koppelt een korte naam (zoals `?realtor=vendr`) aan metadata: logo, website, thema en feed. Per makelaar is er een aparte JSON-feed met vastgoedobjecten in dezelfde map.

## 2. Wat gebeurt er als de pagina laadt?

1. **URL-parameters lezen** – `app.js` kijkt naar `?realtor=...` om te bepalen welke makelaar je wilt tonen. Er is ook een noodoptie `?feed=...` om direct een JSON-feed te testen zonder de mapping te gebruiken.【F:assets/js/app.js†L14-L67】
2. **Mapping ophalen** – Zonder override haalt het script `data/realtors.json` op en zoekt het de juiste makelaar metadata op.【F:assets/js/app.js†L120-L164】【F:data/realtors.json†L1-L88】
3. **Thema, logo en link instellen** – Op basis van de metadata wordt het juiste CSS-bestand geladen en worden logo en link in de header ingevuld.【F:assets/js/app.js†L146-L156】【F:index.html†L18-L75】
4. **Data binnenhalen** – Het script probeert eerst een lokale feed `data/realtor-<uuid>.json`. Als die ontbreekt valt het terug op de externe `feed`-URL.【F:assets/js/app.js†L96-L133】
5. **Data verrijken** – Voor elk object worden handige extra velden berekend (zoals `._province` en `._type`) zodat de filters beter werken.【F:assets/js/app.js†L135-L141】
6. **Filters vullen en interactief maken** – De selectelementen krijgen unieke provincies en typen uit de dataset. Wanneer je een filter kiest worden de resultaten opnieuw berekend.【F:assets/js/app.js†L69-L94】【F:assets/js/app.js†L142-L168】
7. **Kaarten renderen** – Met een `<template>` in `index.html` worden kaarten gevuld met titel, adres, statusbadge en link.【F:index.html†L77-L117】【F:assets/js/app.js†L45-L88】

## 3. Waar moet je als beginner op letten?

* **Veilige defaults** – Er is een `PLACEHOLDER`-afbeelding zodat de layout intact blijft als een object geen foto heeft.【F:assets/js/app.js†L30-L40】
* **Foutafhandeling** – Fouten worden zichtbaar gemaakt in het element `#alert` en gelogd in de console. Dat helpt bij debuggen.【F:assets/js/app.js†L18-L29】【F:index.html†L61-L66】
* **Toegankelijkheid** – De HTML gebruikt labels bij formulieren, aria-attributen voor live-updates en een semantische kaartopbouw in het template.【F:index.html†L32-L117】
* **Herbruikbare thema’s** – Alle makelaars delen dezelfde structuur maar krijgen via CSS-bestanden hun eigen kleuren. In `data/realtors.json` zie je welk thema (`stylesheet_local`) bij welke makelaar hoort, waardoor je gericht kunt aanpassen.【F:data/realtors.json†L5-L88】

## 4. Hoe kun je hiermee oefenen?

* **HTML** – Pas de kaarttemplate aan (bijvoorbeeld voeg een prijs of oppervlakte toe). Dat leert je hoe templating en DOM-manipulatie samenwerken.
* **CSS** – Duik in `base.css` om te zien hoe grid-layout en kaarten worden gestyled. Probeer een nieuw thema in de `themes/` map te maken en link het in `data/realtors.json`.
* **JavaScript** – Speel met de filters in `app.js`. Voeg bijvoorbeeld een filter voor minimale oppervlakte toe, of toon extra statistieken in `#stats`.
* **Data** – Bekijk de JSON-bestanden in `data/`. Begrijp de structuur (velden zoals `name`, `full_address`, `image`, `url`). Dat helpt als je later data wil transformeren of valideren.

## 5. Wat kun je hierna leren?

* **Dieper in JavaScript (ES modules & async/await)** – `app.js` gebruikt moderne features zoals `fetch`, async functies en de Spread-operator. Leer hoe modules werken en hoe je foutafhandeling uitbreidt.
* **Web Performance** – Onderzoek lazy-loading van afbeeldingen, caching van API-responses en het minimaliseren van CSS/JS voor productie.
* **Toegankelijkheid** – Breid de aria-attributen uit, test met screenreaders en zorg voor goede toetsenbordbediening van filters.
* **Testen** – Leer hoe je unit tests of end-to-end tests schrijft voor JavaScript-apps (bijv. met Jest of Playwright) zodat toekomstige wijzigingen veilig zijn.
* **Build tooling** – Uiteindelijk kun je kijken naar bundlers (Vite, Webpack) of CSS preprocessors (Sass) om de projectstructuur schaalbaarder te maken.

Met deze basis kun je comfortabel aanpassingen doen in de embed en heb je een lijstje met onderwerpen om verder te verkennen. Veel succes met je leerreis!
