using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeResitsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeResitsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/resit-disciplines")]
    public async Task<ActionResult<List<OfficeResitDisciplineDto>>> GetResitDisciplines(
        int idUser
    )
    {
        var query =
            "office_resit_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,students_count,retake_students_count"
            + "&order=discipline_name.asc,program_name.asc,course_no.asc,start_module_no.asc,group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения списка дисциплин для пересдач из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeResitGroupRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeResitGroupRow>();

        var response = rows
            .GroupBy(row => new
            {
                row.IdDiscipline,
                row.DisciplineName
            })
            .Select(disciplineGroup =>
            {
                var groupSummaries = disciplineGroup
                    .Where(row => row.IdGroup > 0)
                    .GroupBy(row => row.IdGroup)
                    .Select(groupRows =>
                    {
                        var first = groupRows.First();

                        return new
                        {
                            Row = first,
                            StudentsCount = groupRows.Max(row => row.StudentsCount),
                            RetakeStudentsCount = groupRows.Max(row => row.RetakeStudentsCount)
                        };
                    })
                    .ToList();

                var programs = groupSummaries
                    .Select(summary => summary.Row)
                    .GroupBy(row => row.IdProgram)
                    .Select(programGroup => new OfficeProgramOptionDto
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
                var studentsCount = groupSummaries.Sum(summary => summary.StudentsCount);
                var retakeStudentsCount = groupSummaries.Sum(summary => summary.RetakeStudentsCount);

                return new OfficeResitDisciplineDto
                {
                    IdDiscipline = disciplineGroup.Key.IdDiscipline,
                    DisciplineName = disciplineGroup.Key.DisciplineName,
                    PudUrl = null,
                    Programs = programs,
                    CourseNos = courseNos,
                    ModuleNos = moduleNos,
                    GroupsCount = groupsCount,
                    StudentsCount = studentsCount,
                    RetakeStudentsCount = retakeStudentsCount
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

    private class SupabaseOfficeResitGroupRow
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

        [JsonPropertyName("retake_students_count")]
        public int RetakeStudentsCount { get; set; }
    }
}