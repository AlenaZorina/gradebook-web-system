using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeAttendanceSheetsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeAttendanceSheetsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/attendance-disciplines/{disciplineId:int}/groups")]
    public async Task<ActionResult<List<OfficeAttendanceGroupDto>>> GetAttendanceGroups(
        int idUser,
        int disciplineId
    )
    {
        var query =
            "office_attendance_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_assignment,academic_year,teacher_short_name,students_count,sessions_count,marked_attendance_count,present_attendance_count,absent_attendance_count"
            + $"&id_discipline=eq.{disciplineId}"
            + "&order=group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения групп по дисциплине для посещаемости из Supabase",
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
            .GroupBy(row => NormalizeGroupKey(row))
            .Select(group =>
            {
                var first = group.First();

                var markedAttendanceCount = group.Sum(item => item.MarkedAttendanceCount);
                var presentAttendanceCount = group.Sum(item => item.PresentAttendanceCount);

                decimal? attendancePercent = markedAttendanceCount == 0
                    ? null
                    : Math.Round((decimal)presentAttendanceCount / markedAttendanceCount * 100m, 1);

                return new OfficeAttendanceGroupDto
                {
                    IdDiscipline = first.IdDiscipline,
                    DisciplineName = first.DisciplineName,
                    IdGroup = first.IdGroup,
                    GroupName = first.GroupName,
                    CourseNo = first.CourseNo,
                    IdProgram = first.IdProgram,
                    ProgramName = first.ProgramName,
                    StartModuleNo = first.StartModuleNo,
                    EndModuleNo = first.EndModuleNo,
                    IdAssignment = first.IdAssignment,
                    AcademicYear = first.AcademicYear,
                    TeacherShortName = first.TeacherShortName,
                    StudentsCount = group.Max(item => item.StudentsCount),
                    SessionsCount = group.Sum(item => item.SessionsCount),
                    MarkedAttendanceCount = markedAttendanceCount,
                    PresentAttendanceCount = presentAttendanceCount,
                    AbsentAttendanceCount = group.Sum(item => item.AbsentAttendanceCount),
                    AttendancePercent = attendancePercent
                };
            })
            .OrderBy(item => item.GroupName)
            .ToList();

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/attendance-disciplines/{disciplineId:int}/groups/{groupId:int}/sheet")]
    public async Task<ActionResult<OfficeAttendanceSheetDto>> GetAttendanceSheet(
        int idUser,
        int disciplineId,
        int groupId
    )
    {
        var groupQuery =
            "office_attendance_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name"
            + $"&id_discipline=eq.{disciplineId}"
            + $"&id_group=eq.{groupId}"
            + "&limit=1";

        var groupResult = await _supabase.GetAsync(groupQuery);

        if (!groupResult.Success)
        {
            return StatusCode(
                groupResult.StatusCode,
                new
                {
                    message = "Ошибка получения информации о группе из Supabase",
                    details = groupResult.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var groupRows = JsonSerializer.Deserialize<List<SupabaseOfficeAttendanceGroupRow>>(
            groupResult.Body,
            options
        ) ?? new List<SupabaseOfficeAttendanceGroupRow>();

        var groupInfo = groupRows.FirstOrDefault();

        if (groupInfo is null)
        {
            return NotFound(new { message = "Группа по выбранной дисциплине не найдена" });
        }

        var sheetQuery =
            "office_attendance_sheet_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,id_student,student_surname,student_name,student_fathername,record_book_no,id_session,lesson_date,start_time,end_time,attendance_status"
            + $"&id_discipline=eq.{disciplineId}"
            + $"&id_group=eq.{groupId}"
            + "&order=student_surname.asc,student_name.asc,lesson_date.asc,start_time.asc";

        var sheetResult = await _supabase.GetAsync(sheetQuery);

        if (!sheetResult.Success)
        {
            return StatusCode(
                sheetResult.StatusCode,
                new
                {
                    message = "Ошибка получения ведомости посещаемости из Supabase",
                    details = sheetResult.Body
                }
            );
        }

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeAttendanceSheetRow>>(
            sheetResult.Body,
            options
        ) ?? new List<SupabaseOfficeAttendanceSheetRow>();

        /*
         * ВАЖНО:
         * раньше sessions группировались по id_session, поэтому если в один день
         * было несколько занятий, фронт получал несколько колонок с одинаковой датой.
         *
         * Теперь для экрана УО группируем занятия по lesson_date:
         * одна дата = одна колонка таблицы.
         */
        var sessions = rows
            .Where(row => !string.IsNullOrWhiteSpace(row.LessonDate))
            .GroupBy(row => row.LessonDate)
            .Select(group =>
            {
                var orderedRows = group
                    .OrderBy(row => row.StartTime)
                    .ThenBy(row => row.IdSession)
                    .ToList();

                var first = orderedRows.First();
                var date = DateOnly.Parse(first.LessonDate);

                return new OfficeAttendanceSessionDto
                {
                    IdSession = first.IdSession,
                    LessonDate = first.LessonDate,
                    DateLabel = date.ToString("dd.MM", CultureInfo.GetCultureInfo("ru-RU")),
                    StartTime = first.StartTime,
                    EndTime = first.EndTime
                };
            })
            .OrderBy(item => DateOnly.Parse(item.LessonDate))
            .ThenBy(item => item.StartTime)
            .ToList();

        var students = rows
            .GroupBy(row => new
            {
                row.IdStudent,
                row.StudentSurname,
                row.StudentName,
                row.StudentFathername,
                row.RecordBookNo
            })
            .Select(group => new OfficeAttendanceStudentDto
            {
                IdStudent = group.Key.IdStudent,
                FullName = BuildFullName(
                    group.Key.StudentSurname,
                    group.Key.StudentName,
                    group.Key.StudentFathername
                ),
                RecordBookNo = group.Key.RecordBookNo,
                Attendance = sessions.Select(session =>
                {
                    var statusesForDate = group
                        .Where(item => item.LessonDate == session.LessonDate)
                        .Select(item => item.AttendanceStatus);

                    return new OfficeAttendanceStudentStatusDto
                    {
                        IdSession = session.IdSession,
                        Status = MergeAttendanceStatuses(statusesForDate)
                    };
                }).ToList()
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var allStatuses = students
            .SelectMany(student => student.Attendance)
            .Select(item => item.Status)
            .ToList();

        var marked = allStatuses.Count(status => status == "present" || status == "absent");
        var present = allStatuses.Count(status => status == "present");

        decimal? attendancePercent = marked == 0
            ? null
            : Math.Round((decimal)present / marked * 100m, 1);

        var response = new OfficeAttendanceSheetDto
        {
            IdDiscipline = groupInfo.IdDiscipline,
            DisciplineName = groupInfo.DisciplineName,
            IdGroup = groupInfo.IdGroup,
            GroupName = groupInfo.GroupName,
            CourseNo = groupInfo.CourseNo,
            IdProgram = groupInfo.IdProgram,
            ProgramName = groupInfo.ProgramName,
            IdAssignment = groupInfo.IdAssignment,
            AcademicYear = groupInfo.AcademicYear,
            TeacherShortName = groupInfo.TeacherShortName,
            AttendancePercent = attendancePercent,
            Sessions = sessions,
            Students = students
        };

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

    private static string MergeAttendanceStatuses(IEnumerable<string?> statuses)
    {
        var normalizedStatuses = statuses
            .Select(status => (status ?? string.Empty).Trim().ToLowerInvariant())
            .ToList();

        /*
         * Если в один день у студента несколько занятий:
         * - если хотя бы одно отсутствие, показываем absence за дату;
         * - если отсутствий нет, но есть присутствие, показываем present;
         * - иначе unknown.
         */
        if (normalizedStatuses.Any(status => status == "absent"))
        {
            return "absent";
        }

        if (normalizedStatuses.Any(status => status == "present"))
        {
            return "present";
        }

        return "unknown";
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private class SupabaseOfficeAttendanceGroupRow
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
        public int StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int EndModuleNo { get; set; }

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

    private class SupabaseOfficeAttendanceSheetRow
    {
        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_surname")]
        public string StudentSurname { get; set; } = string.Empty;

        [JsonPropertyName("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student_fathername")]
        public string? StudentFathername { get; set; }

        [JsonPropertyName("record_book_no")]
        public string RecordBookNo { get; set; } = string.Empty;

        [JsonPropertyName("id_session")]
        public int IdSession { get; set; }

        [JsonPropertyName("lesson_date")]
        public string LessonDate { get; set; } = string.Empty;

        [JsonPropertyName("start_time")]
        public string? StartTime { get; set; }

        [JsonPropertyName("end_time")]
        public string? EndTime { get; set; }

        [JsonPropertyName("attendance_status")]
        public string AttendanceStatus { get; set; } = string.Empty;
    }
}