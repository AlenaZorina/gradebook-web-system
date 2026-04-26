using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherAttendanceController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public TeacherAttendanceController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/attendance")]
    public async Task<ActionResult<TeacherAttendanceDto>> GetAttendance(
        int idUser,
        [FromQuery] int? disciplineId,
        [FromQuery] int? groupId)
    {
        if (!disciplineId.HasValue || !groupId.HasValue)
        {
            return BadRequest(new
            {
                message = "Необходимо выбрать дисциплину и группу"
            });
        }

        var query =
            "teacher_attendance_view" +
            "?select=id_session,id_attendance,teacher_user_id,id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,lesson_date,start_time,end_time,id_student,student_surname,student_name,student_fathername,record_book_no,status" +
            $"&teacher_user_id=eq.{idUser}" +
            $"&id_discipline=eq.{disciplineId.Value}" +
            $"&id_group=eq.{groupId.Value}";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка получения посещаемости из Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseAttendanceRecord>>(result.Body, options)
                      ?? new List<SupabaseAttendanceRecord>();

        if (records.Count == 0)
        {
            return NotFound(new
            {
                message = "Посещаемость для выбранной дисциплины и группы не найдена"
            });
        }

        var first = records.First();

        var sessions = records
            .GroupBy(item => new
            {
                item.IdSession,
                item.LessonDate,
                item.StartTime,
                item.EndTime
            })
            .Select(group =>
            {
                var date = DateOnly.Parse(group.Key.LessonDate);
                return new AttendanceSessionDto
                {
                    IdSession = group.Key.IdSession,
                    LessonDate = group.Key.LessonDate,
                    DateLabel = date.ToString("d.MM", CultureInfo.GetCultureInfo("ru-RU")),
                    StartTime = group.Key.StartTime,
                    EndTime = group.Key.EndTime
                };
            })
            .OrderBy(item => DateOnly.Parse(item.LessonDate))
            .ThenBy(item => item.StartTime)
            .ToList();

        var students = records
            .GroupBy(item => new
            {
                item.IdStudent,
                item.StudentSurname,
                item.StudentName,
                item.StudentFathername,
                item.RecordBookNo
            })
            .Select(group =>
            {
                var fullName =
                    $"{group.Key.StudentSurname} {group.Key.StudentName.FirstOrDefault()}." +
                    $"{(string.IsNullOrWhiteSpace(group.Key.StudentFathername) ? "" : group.Key.StudentFathername![0] + ".")}";

                var marks = sessions.Select(session =>
                {
                    var record = group.FirstOrDefault(item => item.IdSession == session.IdSession);

                    return new AttendanceMarkDto
                    {
                        IdSession = session.IdSession,
                        Status = record?.Status ?? "unknown"
                    };
                }).ToList();

                return new AttendanceStudentDto
                {
                    IdStudent = group.Key.IdStudent,
                    FullName = fullName,
                    RecordBookNo = group.Key.RecordBookNo,
                    Marks = marks
                };
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var response = new TeacherAttendanceDto
        {
            TeacherUserId = first.TeacherUserId,
            IdDiscipline = first.IdDiscipline,
            DisciplineName = first.DisciplineName,
            IdGroup = first.IdGroup,
            GroupName = first.GroupName,
            CourseNo = first.CourseNo,
            Sessions = sessions,
            Students = students
        };

        return Ok(response);
    }

    private class SupabaseAttendanceRecord
    {
        [JsonPropertyName("id_session")]
        public int IdSession { get; set; }

        [JsonPropertyName("id_attendance")]
        public int IdAttendance { get; set; }

        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

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

        [JsonPropertyName("lesson_date")]
        public string LessonDate { get; set; } = string.Empty;

        [JsonPropertyName("start_time")]
        public string? StartTime { get; set; }

        [JsonPropertyName("end_time")]
        public string? EndTime { get; set; }

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

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}