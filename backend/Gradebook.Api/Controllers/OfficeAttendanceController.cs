using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeAttendanceController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeAttendanceController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/attendance-disciplines")]
    public async Task<ActionResult<List<OfficeAttendanceDisciplineDto>>> GetAttendanceDisciplines(
        int idUser
    )
    {
        /*
         * Важно:
         * экран "Посещаемость / дисциплины" строим из office_attendance_groups_view,
         * то есть из того же источника, из которого открывается следующий экран групп.
         * Это устраняет баг, когда на карточке написано 5 групп,
         * а после клика открывается другое количество.
         */
        var query =
            "office_attendance_groups_view"
            + "?select=id_discipline,discipline_name,pud_url,id_program,program_name,course_no,start_module_no,end_module_no,id_group,group_name,id_assignment,academic_year,teacher_short_name,students_count,sessions_count,marked_attendance_count,present_attendance_count,absent_attendance_count"
            + "&order=discipline_name.asc,program_name.asc,course_no.asc,start_module_no.asc,group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения списка дисциплин для посещаемости из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeAttendanceGroupRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeAttendanceGroupRow>();

        var response = rows
            .GroupBy(row => new
            {
                row.IdDiscipline,
                row.DisciplineName,
                row.PudUrl
            })
            .Select(group =>
            {
                var uniqueGroupRows = group
                    .Where(row => row.IdGroup > 0)
                    .GroupBy(row => row.IdGroup)
                    .Select(groupRows => groupRows.First())
                    .ToList();

                var programs = uniqueGroupRows
                    .GroupBy(row => row.IdProgram)
                    .Select(programGroup => new OfficeAttendanceProgramOptionDto
                    {
                        IdProgram = programGroup.Key,
                        ProgramName = programGroup
                            .Select(item => item.ProgramName)
                            .FirstOrDefault(name => !string.IsNullOrWhiteSpace(name)) ?? "ОП"
                    })
                    .OrderBy(program => program.ProgramName)
                    .ToList();

                var courseNos = uniqueGroupRows
                    .Select(row => row.CourseNo)
                    .Distinct()
                    .OrderBy(value => value)
                    .ToList();

                var moduleNos = uniqueGroupRows
                    .SelectMany(row => ExpandModules(row.StartModuleNo, row.EndModuleNo))
                    .Distinct()
                    .OrderBy(value => value)
                    .ToList();

                var groupsCount = uniqueGroupRows.Count;

                var studentsCount = uniqueGroupRows.Sum(row => row.StudentsCount);
                var sessionsCount = uniqueGroupRows.Sum(row => row.SessionsCount);
                var markedAttendanceCount = uniqueGroupRows.Sum(row => row.MarkedAttendanceCount);
                var presentAttendanceCount = uniqueGroupRows.Sum(row => row.PresentAttendanceCount);
                var absentAttendanceCount = uniqueGroupRows.Sum(row => row.AbsentAttendanceCount);

                decimal? attendancePercent = markedAttendanceCount == 0
                    ? null
                    : Math.Round((decimal)presentAttendanceCount / markedAttendanceCount * 100m, 1);

                return new OfficeAttendanceDisciplineDto
                {
                    IdDiscipline = group.Key.IdDiscipline,
                    DisciplineName = group.Key.DisciplineName,
                    PudUrl = group.Key.PudUrl,
                    Programs = programs,
                    CourseNos = courseNos,
                    ModuleNos = moduleNos,
                    GroupsCount = groupsCount,
                    StudentsCount = studentsCount,
                    SessionsCount = sessionsCount,
                    MarkedAttendanceCount = markedAttendanceCount,
                    PresentAttendanceCount = presentAttendanceCount,
                    AbsentAttendanceCount = absentAttendanceCount,
                    AttendancePercent = attendancePercent
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

    private class SupabaseOfficeAttendanceGroupRow
    {
        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("pud_url")]
        public string? PudUrl { get; set; }

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("teacher_short_name")]
        public string TeacherShortName { get; set; } = string.Empty;

        [JsonPropertyName("students_count")]
        public int StudentsCount { get; set; }

        [JsonPropertyName("sessions_count")]
        public int SessionsCount { get; set; }

        [JsonPropertyName("marked_attendance_count")]
        public int MarkedAttendanceCount { get; set; }

        [JsonPropertyName("present_attendance_count")]
        public int PresentAttendanceCount { get; set; }

        [JsonPropertyName("absent_attendance_count")]
        public int AbsentAttendanceCount { get; set; }
    }
}