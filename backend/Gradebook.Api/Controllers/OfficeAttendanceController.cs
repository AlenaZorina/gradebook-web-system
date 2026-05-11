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
         * Первый экран "Посещаемость / дисциплины" строим из той же view,
         * из которой формируется следующий экран со списком групп.
         *
         * Важно: группируем не только по id_group, а по group_name.
         * В данных могут быть технические дубли одной и той же группы с разными id,
         * но для пользователя это одна группа, например "РИС-25-1".
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
            .Select(disciplineGroup =>
            {
                var groupSummaries = disciplineGroup
                    .Where(row => row.IdGroup > 0 || !string.IsNullOrWhiteSpace(row.GroupName))
                    .GroupBy(row => NormalizeGroupKey(row))
                    .Select(groupRows =>
                    {
                        var first = groupRows.First();

                        var studentsCount = groupRows.Max(row => row.StudentsCount);
                        var sessionsCount = groupRows.Sum(row => row.SessionsCount);
                        var markedAttendanceCount = groupRows.Sum(row => row.MarkedAttendanceCount);
                        var presentAttendanceCount = groupRows.Sum(row => row.PresentAttendanceCount);
                        var absentAttendanceCount = groupRows.Sum(row => row.AbsentAttendanceCount);

                        return new
                        {
                            Row = first,
                            StudentsCount = studentsCount,
                            SessionsCount = sessionsCount,
                            MarkedAttendanceCount = markedAttendanceCount,
                            PresentAttendanceCount = presentAttendanceCount,
                            AbsentAttendanceCount = absentAttendanceCount
                        };
                    })
                    .ToList();

                var programs = groupSummaries
                    .Select(summary => summary.Row)
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
                var sessionsCount = groupSummaries.Sum(summary => summary.SessionsCount);
                var markedAttendanceCount = groupSummaries.Sum(summary => summary.MarkedAttendanceCount);
                var presentAttendanceCount = groupSummaries.Sum(summary => summary.PresentAttendanceCount);
                var absentAttendanceCount = groupSummaries.Sum(summary => summary.AbsentAttendanceCount);

                decimal? attendancePercent = markedAttendanceCount == 0
                    ? null
                    : Math.Round((decimal)presentAttendanceCount / markedAttendanceCount * 100m, 1);

                return new OfficeAttendanceDisciplineDto
                {
                    IdDiscipline = disciplineGroup.Key.IdDiscipline,
                    DisciplineName = disciplineGroup.Key.DisciplineName,
                    PudUrl = disciplineGroup.Key.PudUrl,
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

    private static string NormalizeGroupKey(SupabaseOfficeAttendanceGroupRow row)
    {
        if (!string.IsNullOrWhiteSpace(row.GroupName))
        {
            return row.GroupName.Trim().ToLowerInvariant();
        }

        return $"id:{row.IdGroup}";
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