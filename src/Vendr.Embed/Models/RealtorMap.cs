using System.Text.Json.Serialization;

namespace Vendr.Embed.Models;

public class RealtorMap
{
    [JsonPropertyName("generated_at")]
    public DateTimeOffset? GeneratedAt { get; set; }

    [JsonPropertyName("realtors")]
    public Dictionary<string, RealtorMeta> Realtors { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public class RealtorMeta
{
    [JsonPropertyName("uuid")]
    public string? Uuid { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("feed")]
    public string? Feed { get; set; }

    [JsonPropertyName("stylesheet_local")]
    public string? StylesheetLocal { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [JsonPropertyName("logo")]
    public string? Logo { get; set; }

    [JsonPropertyName("color")]
    public string? Color { get; set; }
}
