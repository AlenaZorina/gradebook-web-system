using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

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

    public async Task<(bool Success, int StatusCode, string Body)> GetAsync(
        string relativePathAndQuery
    )
    {
        var request = CreateRequest(HttpMethod.Get, relativePathAndQuery);
        var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        return (response.IsSuccessStatusCode, (int)response.StatusCode, body);
    }

    public async Task<(bool Success, int StatusCode, string Body)> PostAsync(
        string relativePathAndQuery,
        object payload,
        string? prefer = null
    )
    {
        var request = CreateRequest(HttpMethod.Post, relativePathAndQuery);

        if (!string.IsNullOrWhiteSpace(prefer))
        {
            request.Headers.Add("Prefer", prefer);
        }

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        return (response.IsSuccessStatusCode, (int)response.StatusCode, body);
    }

    public async Task<(bool Success, int StatusCode, string Body)> RpcAsync(
        string functionName,
        object payload
    )
    {
        return await PostAsync($"rpc/{functionName}", payload);
    }

    public async Task<(bool Success, int StatusCode, string Body)> PatchAsync(
        string relativePathAndQuery,
        object payload
    )
    {
        var request = CreateRequest(HttpMethod.Patch, relativePathAndQuery);
        request.Headers.Add("Prefer", "return=minimal");

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        return (response.IsSuccessStatusCode, (int)response.StatusCode, body);
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string relativePathAndQuery)
    {
        var request = new HttpRequestMessage(
            method,
            $"{_supabaseUrl}/rest/v1/{relativePathAndQuery}"
        );

        request.Headers.Add("apikey", _secretKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _secretKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return request;
    }
}