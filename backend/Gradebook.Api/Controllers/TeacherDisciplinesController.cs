using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherDisciplinesController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public TeacherDisciplinesController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/teacher-disciplines")]
    public async Task<ActionResult<List<TeacherDisciplineDto>>> GetTeacherDisciplines(int idUser)
    {
        var query =
            "teacher_disciplines_view" +
            "?select=id_assignment,teacher_user_id,academic_year,id_discipline,discipline_name,pud_url,id_group,group_name,course_no,program_name,start_module_no,end_module_no" +
            $"&teacher_user_id=eq.{idUser}" +
            "&order=course_no.asc,discipline_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка получения дисциплин из Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseTeacherDisciplineRecord>>(result.Body, options)
                      ?? new List<SupabaseTeacherDisciplineRecord>();

        var response = records.Select(item => new TeacherDisciplineDto
        {
            IdAssignment = item.IdAssignment,
            TeacherUserId = item.TeacherUserId,
            AcademicYear = item.AcademicYear,
            IdDiscipline = item.IdDiscipline,
            DisciplineName = item.DisciplineName,
            PudUrl = item.PudUrl,
            IdGroup = item.IdGroup,
            GroupName = item.GroupName,
            CourseNo = item.CourseNo,
            ProgramName = item.ProgramName,
            StartModuleNo = item.StartModuleNo,
            EndModuleNo = item.EndModuleNo
        }).ToList();

        return Ok(response);
    }

    private class SupabaseTeacherDisciplineRecord
    {
        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("pud_url")]
        public string? PudUrl { get; set; }

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("start_module_no")]
        public int StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int EndModuleNo { get; set; }
    }
}