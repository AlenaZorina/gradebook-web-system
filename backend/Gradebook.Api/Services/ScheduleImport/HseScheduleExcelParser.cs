using System.Globalization;
using System.Text.RegularExpressions;
using NPOI.SS.UserModel;
using NPOI.SS.Util;

namespace Gradebook.Api.Services.ScheduleImport;

public class HseScheduleExcelParser
{
    private readonly DataFormatter _formatter = new(CultureInfo.GetCultureInfo("ru-RU"));

    private static readonly Regex CourseRegex = new(
        @"(?<course>\d)\s*курс",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex GroupRegex = new(
        @"[А-ЯЁA-Z]{1,6}-\d{2}-\d+",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex TimeRegex = new(
        @"(?<sh>\d{1,2})[:.](?<sm>\d{2})\s*[-–—]\s*(?<eh>\d{1,2})[:.](?<em>\d{2})",
        RegexOptions.Compiled
    );

    private static readonly Regex TeacherRegex = new(
        @"(?<surname>[А-ЯЁ][а-яёА-ЯЁ-]+)\s+(?<name>[А-ЯЁ])\.\s*(?<father>[А-ЯЁ])\.",
        RegexOptions.Compiled
    );

    private static readonly Dictionary<string, int> DayOffsets = new()
    {
        ["ПОНЕДЕЛЬНИК"] = 0,
        ["ВТОРНИК"] = 1,
        ["СРЕДА"] = 2,
        ["ЧЕТВЕРГ"] = 3,
        ["ПЯТНИЦА"] = 4,
        ["СУББОТА"] = 5,
        ["ВОСКРЕСЕНЬЕ"] = 6
    };

    public ParsedScheduleFileResult Parse(HseScheduleFile file, int? moduleNo)
    {
        var result = new ParsedScheduleFileResult();

        using var stream = new MemoryStream(file.Bytes);
        var workbook = WorkbookFactory.Create(stream);

        for (var sheetIndex = 0; sheetIndex < workbook.NumberOfSheets; sheetIndex++)
        {
            var sheet = workbook.GetSheetAt(sheetIndex);

            if (sheet is null)
            {
                continue;
            }

            var courseNo = FindCourseNo(sheet);

            if (!courseNo.HasValue)
            {
                result.Warnings.Add($"Лист «{sheet.SheetName}» пропущен: не найден курс.");
                continue;
            }

            var groupHeaderRowIndex = FindGroupHeaderRow(sheet);

            if (!groupHeaderRowIndex.HasValue)
            {
                result.Warnings.Add($"Лист «{sheet.SheetName}» пропущен: не найдена строка с группами.");
                continue;
            }

            var groupColumns = BuildGroupColumnMap(sheet, groupHeaderRowIndex.Value);

            if (groupColumns.Count == 0)
            {
                result.Warnings.Add($"Лист «{sheet.SheetName}» пропущен: не удалось определить группы.");
                continue;
            }

            DateOnly? currentDate = null;

            for (var rowIndex = groupHeaderRowIndex.Value + 1; rowIndex <= sheet.LastRowNum; rowIndex++)
            {
                var row = sheet.GetRow(rowIndex);

                if (row is null)
                {
                    continue;
                }

                var dayOffset = FindDayOffset(sheet, rowIndex);

                if (dayOffset.HasValue)
                {
                    currentDate = file.WeekStart.AddDays(dayOffset.Value);
                }

                var timeRange = FindTimeRange(sheet, rowIndex);

                if (!currentDate.HasValue || timeRange is null)
                {
                    continue;
                }

                foreach (var groupColumn in groupColumns)
                {
                    var colIndex = groupColumn.Key;

                    var mergedRegion = FindMergedRegion(sheet, rowIndex, colIndex);

                    if (mergedRegion is not null)
                    {
                        if (mergedRegion.FirstRow != rowIndex || mergedRegion.FirstColumn != colIndex)
                        {
                            continue;
                        }
                    }

                    var rawText = GetCellTextMergedAware(sheet, rowIndex, colIndex);

                    if (string.IsNullOrWhiteSpace(rawText))
                    {
                        continue;
                    }

                    var lesson = ExtractLesson(rawText);

                    if (string.IsNullOrWhiteSpace(lesson.DisciplineName))
                    {
                        continue;
                    }

                    var affectedGroups = GetAffectedGroups(
                        groupColumns,
                        mergedRegion,
                        colIndex
                    );

                    if (affectedGroups.Count == 0)
                    {
                        continue;
                    }

                    var endTime = timeRange.Value.End;

                    if (mergedRegion is not null && mergedRegion.LastRow > rowIndex)
                    {
                        var lastTimeRange = FindTimeRange(sheet, mergedRegion.LastRow);

                        if (lastTimeRange is not null)
                        {
                            endTime = lastTimeRange.Value.End;
                        }
                    }

                    foreach (var groupName in affectedGroups)
                    {
                        result.Entries.Add(new ParsedScheduleEntry
                        {
                            SheetName = sheet.SheetName,
                            CourseNo = courseNo.Value,
                            GroupName = groupName,
                            LessonDate = currentDate.Value,
                            StartTime = timeRange.Value.Start,
                            EndTime = endTime,
                            WeekNo = file.WeekNo,
                            ModuleNo = moduleNo,
                            DisciplineName = lesson.DisciplineName,
                            TeacherShortName = lesson.TeacherShortName,
                            TeacherSurname = lesson.TeacherSurname,
                            TeacherNameInitial = lesson.TeacherNameInitial,
                            TeacherFathernameInitial = lesson.TeacherFathernameInitial,
                            SourceCell = BuildSourceCell(sheet.SheetName, rowIndex, colIndex),
                            RawText = NormalizeMultiline(rawText)
                        });
                    }
                }
            }
        }

        result.Entries = result.Entries
            .GroupBy(entry => new
            {
                entry.GroupName,
                entry.LessonDate,
                entry.StartTime,
                entry.EndTime,
                entry.DisciplineName,
                entry.TeacherShortName
            })
            .Select(group => group.First())
            .OrderBy(entry => entry.LessonDate)
            .ThenBy(entry => entry.StartTime)
            .ThenBy(entry => entry.GroupName)
            .ToList();

        return result;
    }

    private int? FindCourseNo(ISheet sheet)
    {
        var sheetNameMatch = CourseRegex.Match(sheet.SheetName);

        if (sheetNameMatch.Success)
        {
            return int.Parse(sheetNameMatch.Groups["course"].Value);
        }

        var maxRow = Math.Min(sheet.LastRowNum, 12);

        for (var rowIndex = 0; rowIndex <= maxRow; rowIndex++)
        {
            var row = sheet.GetRow(rowIndex);

            if (row is null)
            {
                continue;
            }

            for (var colIndex = 0; colIndex < row.LastCellNum; colIndex++)
            {
                var text = GetCellTextMergedAware(sheet, rowIndex, colIndex);
                var match = CourseRegex.Match(text);

                if (match.Success)
                {
                    return int.Parse(match.Groups["course"].Value);
                }
            }
        }

        return null;
    }

    private int? FindGroupHeaderRow(ISheet sheet)
    {
        var maxRow = Math.Min(sheet.LastRowNum, 20);

        for (var rowIndex = 0; rowIndex <= maxRow; rowIndex++)
        {
            var row = sheet.GetRow(rowIndex);

            if (row is null)
            {
                continue;
            }

            var groupsCount = 0;

            for (var colIndex = 0; colIndex < row.LastCellNum; colIndex++)
            {
                var text = GetCellTextMergedAware(sheet, rowIndex, colIndex);

                if (GroupRegex.IsMatch(text))
                {
                    groupsCount++;
                }
            }

            if (groupsCount >= 2)
            {
                return rowIndex;
            }
        }

        return null;
    }

    private Dictionary<int, string> BuildGroupColumnMap(ISheet sheet, int headerRowIndex)
    {
        var row = sheet.GetRow(headerRowIndex);
        var result = new Dictionary<int, string>();

        if (row is null)
        {
            return result;
        }

        for (var colIndex = 0; colIndex < row.LastCellNum; colIndex++)
        {
            var text = GetCellTextMergedAware(sheet, headerRowIndex, colIndex);
            var match = GroupRegex.Match(text);

            if (!match.Success)
            {
                continue;
            }

            result[colIndex] = match.Value.Trim();
        }

        return result;
    }

    private int? FindDayOffset(ISheet sheet, int rowIndex)
    {
        for (var colIndex = 0; colIndex <= 3; colIndex++)
        {
            var text = GetCellTextMergedAware(sheet, rowIndex, colIndex)
                .Replace("\n", " ")
                .Replace("\r", " ")
                .Trim()
                .ToUpperInvariant();

            foreach (var day in DayOffsets)
            {
                if (text.Contains(day.Key))
                {
                    return day.Value;
                }
            }
        }

        return null;
    }

    private (TimeOnly Start, TimeOnly End)? FindTimeRange(ISheet sheet, int rowIndex)
    {
        for (var colIndex = 0; colIndex <= 4; colIndex++)
        {
            var text = GetCellTextMergedAware(sheet, rowIndex, colIndex);
            var match = TimeRegex.Match(text);

            if (!match.Success)
            {
                continue;
            }

            var start = new TimeOnly(
                int.Parse(match.Groups["sh"].Value),
                int.Parse(match.Groups["sm"].Value)
            );

            var end = new TimeOnly(
                int.Parse(match.Groups["eh"].Value),
                int.Parse(match.Groups["em"].Value)
            );

            return (start, end);
        }

        return null;
    }

    private string GetCellTextMergedAware(ISheet sheet, int rowIndex, int colIndex)
    {
        var region = FindMergedRegion(sheet, rowIndex, colIndex);

        if (region is not null)
        {
            rowIndex = region.FirstRow;
            colIndex = region.FirstColumn;
        }

        var row = sheet.GetRow(rowIndex);
        var cell = row?.GetCell(colIndex);

        if (cell is null)
        {
            return string.Empty;
        }

        return NormalizeMultiline(_formatter.FormatCellValue(cell));
    }

    private CellRangeAddress? FindMergedRegion(ISheet sheet, int rowIndex, int colIndex)
    {
        for (var i = 0; i < sheet.NumMergedRegions; i++)
        {
            var region = sheet.GetMergedRegion(i);

            if (region.IsInRange(rowIndex, colIndex))
            {
                return region;
            }
        }

        return null;
    }

    private List<string> GetAffectedGroups(
        Dictionary<int, string> groupColumns,
        CellRangeAddress? mergedRegion,
        int currentColIndex
    )
    {
        if (mergedRegion is null)
        {
            return groupColumns.TryGetValue(currentColIndex, out var groupName)
                ? new List<string> { groupName }
                : new List<string>();
        }

        return groupColumns
            .Where(item =>
                item.Key >= mergedRegion.FirstColumn
                && item.Key <= mergedRegion.LastColumn
            )
            .Select(item => item.Value)
            .Distinct()
            .ToList();
    }

    private LessonInfo ExtractLesson(string rawText)
    {
        var normalized = NormalizeMultiline(rawText);

        var lines = normalized
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        if (lines.Count == 0)
        {
            return new LessonInfo();
        }

        var disciplineName = lines[0].Trim();

        var teacherMatch = TeacherRegex.Match(normalized);

        if (!teacherMatch.Success)
        {
            return new LessonInfo
            {
                DisciplineName = disciplineName
            };
        }

        var surname = teacherMatch.Groups["surname"].Value.Trim();
        var nameInitial = teacherMatch.Groups["name"].Value.Trim();
        var fathernameInitial = teacherMatch.Groups["father"].Value.Trim();

        return new LessonInfo
        {
            DisciplineName = disciplineName,
            TeacherShortName = $"{surname} {nameInitial}.{fathernameInitial}.",
            TeacherSurname = surname,
            TeacherNameInitial = nameInitial,
            TeacherFathernameInitial = fathernameInitial
        };
    }

    private static string NormalizeMultiline(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value
            .Replace("\r\n", "\n")
            .Replace("\r", "\n");

        normalized = Regex.Replace(normalized, @"[ \t]+", " ");
        normalized = Regex.Replace(normalized, @"\n{2,}", "\n");

        return normalized.Trim();
    }

    private static string BuildSourceCell(string sheetName, int rowIndex, int colIndex)
    {
        var columnName = CellReference.ConvertNumToColString(colIndex);
        return $"{sheetName}!{columnName}{rowIndex + 1}";
    }

    private class LessonInfo
    {
        public string DisciplineName { get; set; } = string.Empty;

        public string? TeacherShortName { get; set; }

        public string? TeacherSurname { get; set; }

        public string? TeacherNameInitial { get; set; }

        public string? TeacherFathernameInitial { get; set; }
    }
}