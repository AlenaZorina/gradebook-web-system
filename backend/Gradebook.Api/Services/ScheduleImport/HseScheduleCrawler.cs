using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Gradebook.Api.Services.ScheduleImport;

public class HseScheduleCrawler
{
    private const string TimetablePageUrl = "https://perm.hse.ru/students/timetable/";

    private readonly HttpClient _httpClient;

    private static readonly Regex WeeklyScheduleLinkRegex = new(
        @"Расписание\s+занятий\s*\(неделя\s*№\s*(?<week>\d+)\s*[cс]\s*(?<date>\d{2}\.\d{2}\.\d{4})\)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant
    );

    public HseScheduleCrawler(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<HseScheduleFile>> LoadScheduleFilesAsync(
        bool onlyLatest,
        CancellationToken cancellationToken = default
    )
    {
        var pageHtml = await _httpClient.GetStringAsync(TimetablePageUrl, cancellationToken);

        var doc = new HtmlDocument();
        doc.LoadHtml(pageHtml);

        var linkNodes = doc.DocumentNode.SelectNodes("//a[@href]")
            ?? Enumerable.Empty<HtmlNode>();

        var foundLinks = new List<HseScheduleFile>();

        foreach (var link in linkNodes)
        {
            var title = NormalizeText(WebUtility.HtmlDecode(link.InnerText));

            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            var match = WeeklyScheduleLinkRegex.Match(title);

            if (!match.Success)
            {
                continue;
            }

            var href = link.GetAttributeValue("href", "");

            if (string.IsNullOrWhiteSpace(href))
            {
                continue;
            }

            var fileUrl = BuildAbsoluteUrl(href);

            if (!IsHttpUrl(fileUrl))
            {
                continue;
            }

            var weekNo = int.Parse(match.Groups["week"].Value);

            var weekStart = DateOnly.ParseExact(
                match.Groups["date"].Value,
                "dd.MM.yyyy",
                CultureInfo.GetCultureInfo("ru-RU")
            );

            var weekEnd = weekStart.AddDays(6);

            foundLinks.Add(new HseScheduleFile
            {
                Title = title,
                Url = fileUrl,
                FileName = BuildFileName(fileUrl, weekNo, weekStart),
                WeekNo = weekNo,
                WeekStart = weekStart,
                WeekEnd = weekEnd
            });
        }

        foundLinks = foundLinks
            .OrderByDescending(item => item.WeekStart)
            .ThenByDescending(item => item.WeekNo)
            .ToList();

        if (onlyLatest)
        {
            foundLinks = foundLinks.Take(1).ToList();
        }

        foreach (var file in foundLinks)
        {
            file.Bytes = await DownloadFileAsync(file.Url, cancellationToken);
            file.FileHash = Convert.ToHexString(SHA256.HashData(file.Bytes)).ToLowerInvariant();
        }

        return foundLinks;
    }

    private async Task<byte[]> DownloadFileAsync(
        string url,
        CancellationToken cancellationToken
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        request.Headers.UserAgent.ParseAdd(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        );

        request.Headers.Referrer = new Uri(TimetablePageUrl);

        using var response = await _httpClient.SendAsync(request, cancellationToken);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    private static string BuildAbsoluteUrl(string href)
    {
        href = WebUtility.HtmlDecode(href).Trim();

        if (href.StartsWith("//", StringComparison.Ordinal))
        {
            return $"https:{href}";
        }

        if (href.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || href.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return href;
        }

        if (href.StartsWith("/"))
        {
            var baseUri = new Uri(TimetablePageUrl);
            return new Uri(baseUri, href).ToString();
        }

        var fallbackBaseUri = new Uri(TimetablePageUrl);
        return new Uri(fallbackBaseUri, href).ToString();
    }

    private static bool IsHttpUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static string BuildFileName(string fileUrl, int weekNo, DateOnly weekStart)
    {
        if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
        {
            var fileName = Path.GetFileName(uri.LocalPath);

            if (!string.IsNullOrWhiteSpace(fileName))
            {
                return WebUtility.UrlDecode(fileName);
            }
        }

        return $"hse-schedule-week-{weekNo}-{weekStart:yyyy-MM-dd}.xls";
    }

    private static string NormalizeText(string value)
    {
        return Regex.Replace(value ?? string.Empty, @"\s+", " ").Trim();
    }
}
