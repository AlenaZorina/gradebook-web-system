using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherScheduleController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public TeacherScheduleController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/teacher-schedule")]
    public async Task<ActionResult<List<TeacherScheduleItemDto>>> GetTeacherSchedule(int idUser)
    {
        var query =
            "teacher_schedule_view" +
            "?select=id_entry,teacher_user_id,teacher_short_name,department,position,lesson_date,start_time,end_time,week_no,module_no,discipline_name,group_name" +
            $"&teacher_user_id=eq.{idUser}" +
            "&order=lesson_date.asc,start_time.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка получения расписания из Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseTeacherScheduleRecord>>(result.Body, options)
                      ?? new List<SupabaseTeacherScheduleRecord>();

        var response = records.Select(item => new TeacherScheduleItemDto
        {
            IdEntry = item.IdEntry,
            TeacherUserId = item.TeacherUserId,
            TeacherShortName = item.TeacherShortName,
            Department = item.Department,
            Position = item.Position,
            LessonDate = DateOnly.Parse(item.LessonDate),
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            WeekNo = item.WeekNo,
            ModuleNo = item.ModuleNo,
            DisciplineName = item.DisciplineName,
            GroupName = item.GroupName
        }).ToList();

        return Ok(response);
    }

    private class SupabaseTeacherScheduleRecord
    {
        [JsonPropertyName("id_entry")]
        public int IdEntry { get; set; }

        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

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

        [JsonPropertyName("week_no")]
        public int? WeekNo { get; set; }

        [JsonPropertyName("module_no")]
        public int? ModuleNo { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;
    }
}