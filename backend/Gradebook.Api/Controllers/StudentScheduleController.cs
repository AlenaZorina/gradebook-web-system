using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class StudentScheduleController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public StudentScheduleController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/student-schedule")]
    public async Task<ActionResult<List<StudentScheduleItemDto>>> GetStudentSchedule(int idUser)
    {
        var query =
            "student_schedule_view" +
            "?select=id_entry,student_user_id,id_student,id_group,group_name,course_no,program_name,id_discipline,discipline_name,teacher_short_name,department,position,lesson_date,start_time,end_time,module_no,week_no" +
            $"&student_user_id=eq.{idUser}" +
            "&order=lesson_date.asc,start_time.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка получения расписания студента из Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseStudentScheduleRecord>>(
            result.Body,
            options
        ) ?? new List<SupabaseStudentScheduleRecord>();

        var response = records.Select(item => new StudentScheduleItemDto
        {
            IdEntry = item.IdEntry,

            StudentUserId = item.StudentUserId,
            IdStudent = item.IdStudent,

            IdGroup = item.IdGroup,
            GroupName = item.GroupName,
            CourseNo = item.CourseNo,

            ProgramName = item.ProgramName,

            IdDiscipline = item.IdDiscipline,
            DisciplineName = item.DisciplineName,

            TeacherShortName = item.TeacherShortName,
            Department = item.Department,
            Position = item.Position,

            LessonDate = item.LessonDate,
            StartTime = item.StartTime,
            EndTime = item.EndTime,

            ModuleNo = item.ModuleNo,
            WeekNo = item.WeekNo
        }).ToList();

        return Ok(response);
    }

    private class SupabaseStudentScheduleRecord
    {
        [JsonPropertyName("id_entry")]
        public int IdEntry { get; set; }

        [JsonPropertyName("student_user_id")]
        public int StudentUserId { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("teacher_short_name")]
        public string TeacherShortName { get; set; } = string.Empty;

        [JsonPropertyName("department")]
        public string? Department { get; set; }

        [JsonPropertyName("position")]
        public string? Position { get; set; }

        [JsonPropertyName("lesson_date")]
        public string LessonDate { get; set; } = string.Empty;

        [JsonPropertyName("start_time")]
        public string? StartTime { get; set; }

        [JsonPropertyName("end_time")]
        public string? EndTime { get; set; }

        [JsonPropertyName("module_no")]
        public int? ModuleNo { get; set; }

        [JsonPropertyName("week_no")]
        public int? WeekNo { get; set; }
    }
}