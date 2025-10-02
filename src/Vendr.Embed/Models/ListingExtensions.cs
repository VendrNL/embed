using System.Text.RegularExpressions;

namespace Vendr.Embed.Models;

public static partial class ListingExtensions
{
    private static readonly string[] Provinces =
    [
        "Groningen","Friesland","Drenthe","Overijssel","Flevoland",
        "Gelderland","Utrecht","Noord-Holland","Zuid-Holland","Zeeland",
        "Noord-Brabant","Limburg"
    ];

    public static string NormalizeStatus(this Listing listing)
    {
        if (listing.IsSold is true) return "sold";

        var availability = listing.Availability?.Trim().ToLowerInvariant();
        if (availability == "sold") return "sold";
        if (availability == "sold_stc") return "sold_stc";
        if (availability == "under_bid") return "under_bid";

        var status = listing.Status?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(status))
        {
            if (SoldRegex().IsMatch(status)) return "sold";
            if (SoldStcRegex().IsMatch(status)) return "sold_stc";
            if (UnderBidRegex().IsMatch(status)) return "under_bid";
        }

        return "available";
    }

    public static string StatusLabel(this Listing listing)
        => listing.NormalizeStatus() switch
        {
            "sold" => "Verkocht",
            "under_bid" => "Onder bod",
            "sold_stc" => "Verkocht o.v.",
            _ => "Beschikbaar"
        };

    public static void Enrich(this Listing listing)
    {
        listing.ComputedProvince = DetermineProvince(listing);
        listing.ComputedType = DetermineType(listing);
    }

    private static string DetermineProvince(Listing listing)
    {
        var haystack = string.Join(' ', new[]
        {
            listing.Province,
            listing.FullAddress,
            listing.City,
            listing.Location
        }.Where(x => !string.IsNullOrWhiteSpace(x)));

        foreach (var province in Provinces)
        {
            if (haystack.Contains(province, StringComparison.OrdinalIgnoreCase))
            {
                return province;
            }
        }

        return string.Empty;
    }

    private static string DetermineType(Listing listing)
    {
        var haystack = string.Join(' ', new[]
        {
            listing.AssetType,
            listing.Type,
            listing.Specifications,
            listing.Description,
            listing.SellingProcedure
        }.Where(x => !string.IsNullOrWhiteSpace(x))).ToLowerInvariant();

        if (haystack.Contains("kantoor")) return "Kantoor";
        if (haystack.Contains("winkel")) return "Winkel";
        if (haystack.Contains("logistiek") || haystack.Contains("bedrijfshal") || haystack.Contains("magazijn"))
            return "Bedrijfsruimte";
        if (haystack.Contains("bouwgrond") || haystack.Contains("grond"))
            return "Grond";
        if (haystack.Contains("horeca")) return "Horeca";
        return "Overig";
    }

    [GeneratedRegex("verkocht(?!.*voorbehoud)")]
    private static partial Regex SoldRegex();

    [GeneratedRegex("verkocht.*voorbehoud")]
    private static partial Regex SoldStcRegex();

    [GeneratedRegex("onder.*bod")]
    private static partial Regex UnderBidRegex();
}
