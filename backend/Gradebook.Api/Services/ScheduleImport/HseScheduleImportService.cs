using System.Text.Json;
using Gradebook.Api.Dtos;

namespace Gradebook.Api.Services.ScheduleImport;

public class HseScheduleImportService
{
    private readonly HseScheduleCrawler _crawler;
    private readonly HseScheduleExcelParser _parser;
    private readonly SupabaseRestClient _supabase;

    public HseScheduleImportService(
        HseScheduleCrawler crawler,
        HseScheduleExcelParser parser,
        SupabaseRestClient supabase
    )
    {
        _crawler = crawler;
        _parser = parser;
        _supabase = supabase;
    }

    public async Task<HseScheduleImportResultDto> ImportAsync(
        int idUser,
        HseScheduleImportRequestDto request,
        CancellationToken cancellationToken = default
    )
    {
        var summary = new HseScheduleImportResultDto();

        var files = await _crawler.LoadScheduleFilesAsync(
            request.OnlyLatest,
            cancellationToken
        );

        summary.FoundLinksCount = files.Count;

        if (files.Count == 0)
        {
            summary.Warnings.Add("На странице ВШЭ не найдено weekly-расписаний нужного формата.");
            return summary;
        }

        foreach (var file in files)
        {
            summary.DownloadedFilesCount++;

            ParsedScheduleFileResult parsed;

            try
            {
                parsed = _parser.Parse(file, request.ModuleNo);
            }
            catch (Exception ex)
            {
                summary.SkippedEntriesCount++;
                summary.Warnings.Add($"Не удалось распарсить файл «{file.Title}»: {ex.Message}");
                continue;
            }

            summary.Warnings.AddRange(parsed.Warnings);

            if (parsed.Entries.Count == 0)
            {
                summary.Warnings.Add($"Файл «{file.Title}» не содержит распознанных занятий.");
                continue;
            }

            var rpcPayload = new
            {
                p_imported_by_user_id = idUser,
                p_source_url = file.Url,
                p_file_name = file.FileName,
                p_week_no = file.WeekNo,
                p_week_start = file.WeekStart.ToString("yyyy-MM-dd"),
                p_week_end = file.WeekEnd.ToString("yyyy-MM-dd"),
                p_module_no = request.ModuleNo,
                p_file_hash = file.FileHash,
                p_entries = parsed.Entries.Select(entry => new
                {
                    sheetName = entry.SheetName,
                    courseNo = entry.CourseNo,
                    groupName = entry.GroupName,
                    lessonDate = entry.LessonDate.ToString("yyyy-MM-dd"),
                    startTime = entry.StartTime.ToString("HH:mm:ss"),
                    endTime = entry.EndTime.ToString("HH:mm:ss"),
                    weekNo = entry.WeekNo,
                    moduleNo = entry.ModuleNo,
                    disciplineName = entry.DisciplineName,
                    teacherShortName = entry.TeacherShortName,
                    teacherSurname = entry.TeacherSurname,
                    teacherNameInitial = entry.TeacherNameInitial,
                    teacherFathernameInitial = entry.TeacherFathernameInitial,
                    sourceCell = entry.SourceCell,
                    rawText = entry.RawText
                }).ToList()
            };

            var rpcResult = await _supabase.RpcAsync(
                "hse_import_schedule_entries",
                rpcPayload
            );

            if (!rpcResult.Success)
            {
                summary.SkippedEntriesCount += parsed.Entries.Count;
                summary.Warnings.Add(
                    $"Supabase RPC вернул ошибку при импорте «{file.Title}»: {rpcResult.Body}"
                );

                continue;
            }

            var importResult = DeserializeImportResult(rpcResult.Body);

            summary.CreatedImportsCount += importResult.CreatedImportsCount;
            summary.DuplicateFilesCount += importResult.DuplicateFilesCount;
            summary.AddedEntriesCount += importResult.AddedEntriesCount;
            summary.SkippedEntriesCount += importResult.SkippedEntriesCount;
            summary.CreatedDisciplinesCount += importResult.CreatedDisciplinesCount;
            summary.CreatedTeachersCount += importResult.CreatedTeachersCount;
            summary.CreatedGroupsCount += importResult.CreatedGroupsCount;
            summary.CreatedAssignmentsCount += importResult.CreatedAssignmentsCount;
            summary.CreatedAttendanceSessionsCount += importResult.CreatedAttendanceSessionsCount;
            summary.Warnings.AddRange(importResult.Warnings);
        }

        summary.Warnings = summary.Warnings
            .Where(warning => !string.IsNullOrWhiteSpace(warning))
            .Distinct()
            .Take(80)
            .ToList();

        return summary;
    }

    private static HseScheduleImportResultDto DeserializeImportResult(string body)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var result = JsonSerializer.Deserialize<HseScheduleImportResultDto>(body, options);

        return result ?? new HseScheduleImportResultDto
        {
            Warnings = new List<string>
            {
                "RPC-функция вернула пустой результат."
            }
        };
    }
}