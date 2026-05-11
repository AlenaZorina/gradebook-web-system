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
        var query =
            "office_final_sheet_disciplines_view"
            + "?select=id_discipline,discipline_name,pud_url,id_program,program_name,course_no,start_module_no,end_module_no,id_group,group_name,id_assignment,id_sheet,sheet_type,sheet_status,students_count,final_grades_count,filled_final_grades_count,failed_students_count,submitted_sheets_count,approved_sheets_count"
            + "&order=discipline_name.asc,program_name.asc,course_no.asc,start_module_no.asc";

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

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetDisciplineRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetDisciplineRow>();

        var response = rows
            .GroupBy(row => new
            {
                row.IdDiscipline,
                row.DisciplineName,
                row.PudUrl
            })
            .Select(group =>
            {
                var programs = group
                    .Where(row => row.IdProgram.HasValue)
                    .GroupBy(row => row.IdProgram!.Value)
                    .Select(programGroup => new OfficeFinalSheetProgramOptionDto
                    {
                        IdProgram = programGroup.Key,
                        ProgramName = programGroup
                            .Select(item => item.ProgramName)
                            .FirstOrDefault(name => !string.IsNullOrWhiteSpace(name)) ?? "ОП"
                    })
                    .OrderBy(program => program.ProgramName)
                    .ToList();

                var courseNos = group
                    .Where(row => row.CourseNo.HasValue)
                    .Select(row => row.CourseNo!.Value)
                    .Distinct()
                    .OrderBy(value => value)
                    .ToList();

                var moduleNos = group
                    .SelectMany(row => ExpandModules(row.StartModuleNo, row.EndModuleNo))
                    .Distinct()
                    .OrderBy(value => value)
                    .ToList();

                var uniqueGroupRows = group
    .Where(row => row.IdGroup.HasValue || !string.IsNullOrWhiteSpace(row.GroupName))
    .GroupBy(row =>
        !string.IsNullOrWhiteSpace(row.GroupName)
            ? row.GroupName.Trim().ToLowerInvariant()
            : $"id:{row.IdGroup}"
    )
    .Select(groupRows => groupRows.First())
    .ToList();

var groupsCount = uniqueGroupRows.Count;

// В интерфейсе УО одна группа по дисциплине соответствует одной итоговой ведомости.
// Поэтому количество ведомостей на карточке считаем по уникальным группам,
// а не по количеству строк/id_sheet во view.
var finalSheetsCount = groupsCount;

var studentsCount = uniqueGroupRows.Sum(row => row.StudentsCount);
var submittedSheetsCount = uniqueGroupRows.Sum(row => row.SubmittedSheetsCount);
var approvedSheetsCount = uniqueGroupRows.Sum(row => row.ApprovedSheetsCount);
var filledFinalGradesCount = uniqueGroupRows.Sum(row => row.FilledFinalGradesCount);
var failedStudentsCount = uniqueGroupRows.Sum(row => row.FailedStudentsCount);


                decimal? filledPercent = studentsCount == 0
                    ? null
                    : Math.Round((decimal)filledFinalGradesCount / studentsCount * 100m, 1);

                return new OfficeFinalSheetDisciplineDto
                {
                    IdDiscipline = group.Key.IdDiscipline,
                    DisciplineName = group.Key.DisciplineName,
                    PudUrl = group.Key.PudUrl,
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

    private class SupabaseOfficeFinalSheetDisciplineRow
    {
        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("pud_url")]
        public string? PudUrl { get; set; }

        [JsonPropertyName("id_program")]
        public int? IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string? ProgramName { get; set; }

        [JsonPropertyName("course_no")]
        public int? CourseNo { get; set; }

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_group")]
        public int? IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string? GroupName { get; set; }

        [JsonPropertyName("id_assignment")]
        public int? IdAssignment { get; set; }

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_type")]
        public string? SheetType { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

        [JsonPropertyName("students_count")]
        public int StudentsCount { get; set; }

        [JsonPropertyName("final_grades_count")]
        public int FinalGradesCount { get; set; }

        [JsonPropertyName("filled_final_grades_count")]
        public int FilledFinalGradesCount { get; set; }

        [JsonPropertyName("failed_students_count")]
        public int FailedStudentsCount { get; set; }

        [JsonPropertyName("submitted_sheets_count")]
        public int SubmittedSheetsCount { get; set; }

        [JsonPropertyName("approved_sheets_count")]
        public int ApprovedSheetsCount { get; set; }
    }
}