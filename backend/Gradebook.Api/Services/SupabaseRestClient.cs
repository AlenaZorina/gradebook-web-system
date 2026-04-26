using System.Net.Http.Headers;

namespace Gradebook.Api.Services;

public class SupabaseRestClient
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _secretKey;

    public SupabaseRestClient(HttpClient httpClient, string supabaseUrl, string secretKey)
    {
        _httpClient = httpClient;
        _supabaseUrl = supabaseUrl.TrimEnd('/');
        _secretKey = secretKey;
    }

    public async Task<(bool Success, int StatusCode, string Body)> GetAsync(string relativePathAndQuery)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_supabaseUrl}/rest/v1/{relativePathAndQuery}"
        );

        request.Headers.Add("apikey", _secretKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        return (response.IsSuccessStatusCode, (int)response.StatusCode, body);
    }
}