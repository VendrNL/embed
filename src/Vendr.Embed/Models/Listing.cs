using System.Text.Json.Serialization;

namespace Vendr.Embed.Models;

public class Listing
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("full_address")]
    public string? FullAddress { get; set; }

    [JsonPropertyName("province")]
    public string? Province { get; set; }

    [JsonPropertyName("city")]
    public string? City { get; set; }

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("asset_type")]
    public string? AssetType { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("specifications")]
    public string? Specifications { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("selling_procedure")]
    public string? SellingProcedure { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("availability")]
    public string? Availability { get; set; }

    [JsonPropertyName("is_sold")]
    public bool? IsSold { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("image")]
    public string? Image { get; set; }

    public string ComputedProvince { get; set; } = string.Empty;
    public string ComputedType { get; set; } = string.Empty;
}
