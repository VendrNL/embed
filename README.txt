# Vendr Embed (MudBlazor)

Deze repository bevat een Blazor WebAssembly-embed gebouwd met de MudBlazor component library.

## Projectstructuur
- `src/Vendr.Embed/` – hoofdproject (Blazor WebAssembly + MudBlazor)
- `data/` – JSON feeds (worden automatisch gebundeld naar `wwwroot/data` via de csproj)

## Ontwikkeling
1. Installeer .NET 8 SDK.
   - Als de `dotnet` CLI niet beschikbaar is (bijvoorbeeld in een container), gebruik dan het hulpscript `./scripts/dotnet.sh`. Dit script downloadt automatisch een lokale SDK naar `.dotnet/` en voert het gevraagde `dotnet`-commando uit, bijvoorbeeld: `./scripts/dotnet.sh build src/Vendr.Embed/Vendr.Embed.csproj`.
2. Navigeer naar `src/Vendr.Embed`.
3. Voer `dotnet restore` en `dotnet build` uit (of gebruik het hulpscript hierboven).
4. Start lokaal met `dotnet run` of publiceer met `dotnet publish -c Release`.

De embed leest standaard `?realtor=` uit de URL en past thema, logo, filters en kaarten aan op basis van de datafeeds.
