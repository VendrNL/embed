# Vendr Embed (MudBlazor)

Deze repository bevat een Blazor WebAssembly-embed gebouwd met de MudBlazor component library.

## Projectstructuur
- `src/Vendr.Embed/` – hoofdproject (Blazor WebAssembly + MudBlazor)
- `data/` – JSON feeds (worden automatisch gebundeld naar `wwwroot/data` via de csproj)

## Ontwikkeling
1. Installeer .NET 8 SDK.
2. Navigeer naar `src/Vendr.Embed`.
3. Voer `dotnet restore` en `dotnet build` uit.
4. Start lokaal met `dotnet run` of publiceer met `dotnet publish -c Release`.

De embed leest standaard `?realtor=` uit de URL en past thema, logo, filters en kaarten aan op basis van de datafeeds.
