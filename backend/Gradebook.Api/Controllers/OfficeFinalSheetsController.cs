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
    var options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    const int pageSize = 100;
    var offset = 0;
    var disciplineIds = new HashSet<int>();

    while (true)
    {
        var idsQuery =
            "office_final_sheet_groups_view"
            + "?select=id_discipline"
            + $"&limit={pageSize}"
            + $"&offset={offset}";

        var idsResult = await _supabase.GetAsync(idsQuery);

        if (!idsResult.Success)
        {
            return StatusCode(
                idsResult.StatusCode,
                new
                {
                    message = "Ошибка получения идентификаторов дисциплин для итоговых ведомостей из Supabase",
                    details = idsResult.Body
                }
            );
        }

        var idRows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetDisciplineIdRow>>(
            idsResult.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetDisciplineIdRow>();

        foreach (var row in idRows)
        {
            disciplineIds.Add(row.IdDiscipline);
        }

        if (idRows.Count < pageSize)
        {
            break;
        }

        offset += pageSize;
    }

    var response = new List<OfficeFinalSheetDisciplineDto>();

    foreach (var disciplineId in disciplineIds.OrderBy(value => value))
    {
        var groupsQuery =
            "office_final_sheet_groups_view"
            + "?select=id_discipline,discipline_name,id_program,program_name,course_no,start_module_no,end_module_no,id_group,group_name,id_assignment,id_sheet,sheet_status,students_count,filled_final_grades_count,failed_students_count"
            + $"&id_discipline=eq.{disciplineId}"
            + "&order=group_name.asc";

        var groupsResult = await _supabase.GetAsync(groupsQuery);

        if (!groupsResult.Success)
        {
            return StatusCode(
                groupsResult.StatusCode,
                new
                {
                    message = "Ошибка получения групп для итоговых ведомостей из Supabase",
                    details = groupsResult.Body
                }
            );
        }

        var groupRows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetDisciplineRow>>(
            groupsResult.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetDisciplineRow>();

        if (groupRows.Count == 0)
        {
            continue;
        }

        var firstRow = groupRows.First();

        var uniqueGroupRows = groupRows
            .Where(row => row.IdGroup.HasValue)
            .GroupBy(row => row.IdAssignment ?? row.IdGroup!.Value)
            .Select(groupRows => groupRows.First())
            .ToList();

        var programs = uniqueGroupRows
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

        var courseNos = uniqueGroupRows
            .Where(row => row.CourseNo.HasValue)
            .Select(row => row.CourseNo!.Value)
            .Distinct()
            .OrderBy(value => value)
            .ToList();

        var moduleNos = uniqueGroupRows
            .SelectMany(row => ExpandModules(row.StartModuleNo, row.EndModuleNo))
            .Distinct()
            .OrderBy(value => value)
            .ToList();

        var groupsCount = uniqueGroupRows
            .Where(row => row.IdGroup.HasValue)
            .Select(row => row.IdGroup!.Value)
            .Distinct()
            .Count();

        var finalSheetsCount = groupsCount;

        var studentsCount = uniqueGroupRows.Sum(row => row.StudentsCount);
        var filledFinalGradesCount = uniqueGroupRows.Sum(row => row.FilledFinalGradesCount);
        var failedStudentsCount = uniqueGroupRows.Sum(row => row.FailedStudentsCount);

        var submittedSheetsCount = uniqueGroupRows.Count(row =>
            IsSubmittedSheetStatus(row.SheetStatus)
        );

        var approvedSheetsCount = uniqueGroupRows.Count(row =>
            IsApprovedSheetStatus(row.SheetStatus)
        );

        decimal? filledPercent = studentsCount == 0
            ? null
            : Math.Round((decimal)filledFinalGradesCount / studentsCount * 100m, 1);

        response.Add(new OfficeFinalSheetDisciplineDto
        {
            IdDiscipline = firstRow.IdDiscipline,
            DisciplineName = firstRow.DisciplineName,
            PudUrl = firstRow.PudUrl,
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
        });
    }

    return Ok(response.OrderBy(item => item.DisciplineName).ToList());
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

    private class SupabaseOfficeFinalSheetDisciplineIdRow
{
    [JsonPropertyName("id_discipline")]
    public int IdDiscipline { get; set; }
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