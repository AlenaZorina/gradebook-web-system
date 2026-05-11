using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeFinalSheetsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeFinalSheetsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/final-sheet-disciplines")]
    public async Task<ActionResult<List<OfficeFinalSheetDisciplineDto>>> GetFinalSheetDisciplines(
        int idUser
    )
    {
        /*
         * Первый экран "Итоговые ведомости / дисциплины" строим из той же view,
         * что и следующий экран со списком групп.
         *
         * Это нужно, чтобы:
         * 1) количество групп на карточке дисциплины совпадало со следующим экраном;
         * 2) количество ведомостей было равно количеству групп;
         * 3) дубли строк во view не раздували счетчики.
         */
        var query =
            "office_final_sheet_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,students_count,filled_final_grades_count,failed_students_count"
            + "&order=discipline_name.asc,program_name.asc,course_no.asc,start_module_no.asc,group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения списка дисциплин для итоговых ведомостей из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetGroupRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetGroupRow>();

        var response = rows
            .GroupBy(row => new
            {
                row.IdDiscipline,
                row.DisciplineName
            })
            .Select(disciplineGroup =>
            {
                var groupSummaries = disciplineGroup
                    .Where(row => row.IdGroup > 0 || !string.IsNullOrWhiteSpace(row.GroupName))
                    .GroupBy(row => NormalizeGroupKey(row))
                    .Select(groupRows =>
                    {
                        var first = groupRows.First();

                        return new
                        {
                            Row = first,
                            StudentsCount = groupRows.Max(row => row.StudentsCount),
                            FilledFinalGradesCount = groupRows.Max(row => row.FilledFinalGradesCount),
                            FailedStudentsCount = groupRows.Max(row => row.FailedStudentsCount),
                            SheetStatus = groupRows
                                .Select(row => row.SheetStatus)
                                .FirstOrDefault(status => !string.IsNullOrWhiteSpace(status))
                        };
                    })
                    .ToList();

                var programs = groupSummaries
                    .Select(summary => summary.Row)
                    .GroupBy(row => row.IdProgram)
                    .Select(programGroup => new OfficeFinalSheetProgramOptionDto
                    {
                        IdProgram = programGroup.Key,
                        ProgramName = programGroup
                            .Select(item => item.ProgramName)
                            .FirstOrDefault(name => !string.IsNullOrWhiteSpace(name)) ?? "ОП"
                    })
                    .OrderBy(program => program.ProgramName)
                    .ToList();

                var courseNos = groupSummaries
                    .Select(summary => summary.Row.CourseNo)
                    .Distinct()
                    .OrderBy(value => value)
                    .ToList();

                var moduleNos = groupSummaries
                    .SelectMany(summary =>
                        ExpandModules(summary.Row.StartModuleNo, summary.Row.EndModuleNo)
                    )
                    .Distinct()
                    .OrderBy(value => value)
                    .ToList();

                var groupsCount = groupSummaries.Count;

                // Для интерфейса УО: одна группа по дисциплине = одна итоговая ведомость.
                var finalSheetsCount = groupsCount;

                var studentsCount = groupSummaries.Sum(summary => summary.StudentsCount);
                var filledFinalGradesCount = groupSummaries.Sum(summary => summary.FilledFinalGradesCount);
                var failedStudentsCount = groupSummaries.Sum(summary => summary.FailedStudentsCount);

                var submittedSheetsCount = groupSummaries.Count(summary =>
                    IsSubmittedSheetStatus(summary.SheetStatus)
                );

                var approvedSheetsCount = groupSummaries.Count(summary =>
                    IsApprovedSheetStatus(summary.SheetStatus)
                );

                decimal? filledPercent = studentsCount == 0
                    ? null
                    : Math.Round((decimal)filledFinalGradesCount / studentsCount * 100m, 1);

                return new OfficeFinalSheetDisciplineDto
                {
                    IdDiscipline = disciplineGroup.Key.IdDiscipline,
                    DisciplineName = disciplineGroup.Key.DisciplineName,
                    PudUrl = null,
                    Programs = programs,
                    CourseNos = courseNos,
                    ModuleNos = moduleNos,
                    GroupsCount = groupsCount,
                    StudentsCount = studentsCount,
                    FinalSheetsCount = finalSheetsCount,
                    SubmittedSheetsCount = submittedSheetsCount,
                    ApprovedSheetsCount = approvedSheetsCount,
                    FilledFinalGradesCount = filledFinalGradesCount,
                    FailedStudentsCount = failedStudentsCount,
                    FilledPercent = filledPercent
                };
            })
            .OrderBy(item => item.DisciplineName)
            .ToList();

        return Ok(response);
    }

    private static string NormalizeGroupKey(SupabaseOfficeFinalSheetGroupRow row)
    {
        if (!string.IsNullOrWhiteSpace(row.GroupName))
        {
            return row.GroupName.Trim().ToLowerInvariant();
        }

        return $"id:{row.IdGroup}";
    }

    private static bool IsSubmittedSheetStatus(string? status)
    {
        var normalizedStatus = (status ?? string.Empty).Trim().ToLowerInvariant();

        return normalizedStatus == "submitted"
            || normalizedStatus == "sent"
            || normalizedStatus == "на утверждении"
            || normalizedStatus.Contains("submitted")
            || normalizedStatus.Contains("отправ")
            || normalizedStatus.Contains("утвержд");
    }

    private static bool IsApprovedSheetStatus(string? status)
    {
        var normalizedStatus = (status ?? string.Empty).Trim().ToLowerInvariant();

        return normalizedStatus == "approved"
            || normalizedStatus == "утверждена"
            || normalizedStatus == "утверждено"
            || normalizedStatus.Contains("approved")
            || normalizedStatus.Contains("утвержд");
    }

    private static IEnumerable<int> ExpandModules(int? startModuleNo, int? endModuleNo)
    {
        if (!startModuleNo.HasValue && !endModuleNo.HasValue)
        {
            return Enumerable.Empty<int>();
        }

        var start = startModuleNo ?? endModuleNo!.Value;
        var end = endModuleNo ?? startModuleNo!.Value;

        if (end < start)
        {
            return new[] { start };
        }

        return Enumerable.Range(start, end - start + 1);
    }

    private class SupabaseOfficeFinalSheetGroupRow
    {
        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("teacher_short_name")]
        public string TeacherShortName { get; set; } = string.Empty;

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

        [JsonPropertyName("students_count")]
        public int StudentsCount { get; set; }

        [JsonPropertyName("filled_final_grades_count")]
        public int FilledFinalGradesCount { get; set; }

        [JsonPropertyName("failed_students_count")]
        public int FailedStudentsCount { get; set; }
    }
}