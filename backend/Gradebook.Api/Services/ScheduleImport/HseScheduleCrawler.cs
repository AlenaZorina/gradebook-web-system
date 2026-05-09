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

        var links = doc.DocumentNode.SelectNodes("//a[@href]") ?? Enumerable.Empty<HtmlNode>();

        var foundLinks = new List<HseScheduleFile>();

        foreach (var link in links)
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
            file.Bytes = await _httpClient.GetByteArrayAsync(file.Url, cancellationToken);
            file.FileHash = Convert.ToHexString(SHA256.HashData(file.Bytes)).ToLowerInvariant();
        }

        return foundLinks;
    }

    private static string BuildAbsoluteUrl(string href)
    {
        if (Uri.TryCreate(href, UriKind.Absolute, out var absoluteUri))
        {
            return absoluteUri.ToString();
        }

        var baseUri = new Uri(TimetablePageUrl);
        return new Uri(baseUri, href).ToString();
    }

    private static string BuildFileName(string fileUrl, int weekNo, DateOnly weekStart)
    {
        var uri = new Uri(fileUrl);
        var fileName = Path.GetFileName(uri.LocalPath);

        if (!string.IsNullOrWhiteSpace(fileName))
        {
            return fileName;
        }

        return $"hse-schedule-week-{weekNo}-{weekStart:yyyy-MM-dd}.xls";
    }

    private static string NormalizeText(string value)
    {
        return Regex.Replace(value ?? string.Empty, @"\s+", " ").Trim();
    }
}