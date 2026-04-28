using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class StudentAttendanceController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public StudentAttendanceController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/student-attendance")]
    public async Task<ActionResult<StudentAttendanceDto>> GetStudentAttendance(
        int idUser,
        [FromQuery] int? disciplineId
    )
    {
        if (!disciplineId.HasValue)
        {
            return BadRequest(new { message = "Необходимо выбрать дисциплину" });
        }

        var query =
            "student_attendance_view"
            + "?select=student_user_id,id_student,id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,program_name,academic_year,id_session,lesson_date,start_time,end_time,status"
            + $"&student_user_id=eq.{idUser}"
            + $"&id_discipline=eq.{disciplineId.Value}"
            + "&order=lesson_date.asc,start_time.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения посещаемости студента из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseStudentAttendanceRecord>>(
            result.Body,
            options
        ) ?? new List<SupabaseStudentAttendanceRecord>();

        if (records.Count == 0)
        {
            return NotFound(new { message = "Посещаемость по выбранной дисциплине не найдена" });
        }

        var first = records.First();

        var sessions = records
            .GroupBy(item => new
            {
                item.IdSession,
                item.LessonDate,
                item.StartTime,
                item.EndTime,
                item.Status
            })
            .Select(group =>
            {
                var date = DateOnly.Parse(group.Key.LessonDate);

                return new StudentAttendanceSessionDto
                {
                    IdSession = group.Key.IdSession,
                    LessonDate = group.Key.LessonDate,
                    DateLabel = date.ToString("dd.MM", CultureInfo.GetCultureInfo("ru-RU")),
                    StartTime = group.Key.StartTime,
                    EndTime = group.Key.EndTime,
                    Status = string.IsNullOrWhiteSpace(group.Key.Status) ? "unknown" : group.Key.Status
                };
            })
            .OrderBy(item => DateOnly.Parse(item.LessonDate))
            .ThenBy(item => item.StartTime)
            .ToList();

        var countedSessions = sessions
            .Where(item => item.Status == "present" || item.Status == "absent")
            .ToList();

        int? attendancePercent = null;

        if (countedSessions.Count > 0)
        {
            var presentCount = countedSessions.Count(item => item.Status == "present");
            attendancePercent = (int)Math.Round((double)presentCount / countedSessions.Count * 100);
        }

        var response = new StudentAttendanceDto
        {
            StudentUserId = first.StudentUserId,
            IdStudent = first.IdStudent,
            IdAssignment = first.IdAssignment,
            IdDiscipline = first.IdDiscipline,
            DisciplineName = first.DisciplineName,
            IdGroup = first.IdGroup,
            GroupName = first.GroupName,
            CourseNo = first.CourseNo,
            ProgramName = first.ProgramName,
            AcademicYear = first.AcademicYear,
            AttendancePercent = attendancePercent,
            Sessions = sessions
        };

        return Ok(response);
    }

    private class SupabaseStudentAttendanceRecord
    {
        [JsonPropertyName("student_user_id")]
        public int StudentUserId { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

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

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("id_session")]
        public int IdSession { get; set; }

        [JsonPropertyName("lesson_date")]
        public string LessonDate { get; set; } = string.Empty;

        [JsonPropertyName("start_time")]
        public string? StartTime { get; set; }

        [JsonPropertyName("end_time")]
        public string? EndTime { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}