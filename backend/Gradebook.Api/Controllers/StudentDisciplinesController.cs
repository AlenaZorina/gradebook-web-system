using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class StudentDisciplinesController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public StudentDisciplinesController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/student-disciplines")]
    public async Task<ActionResult<List<StudentDisciplineDto>>> GetStudentDisciplines(int idUser)
    {
        var query =
            "student_disciplines_view" +
            "?select=student_user_id,id_student,id_group,group_name,course_no,id_program,program_name,id_discipline,discipline_name,start_module_no,end_module_no,academic_year,teachers_count,teachers_short_names" +
            $"&student_user_id=eq.{idUser}" +
            "&order=course_no.asc,discipline_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка получения дисциплин студента из Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseStudentDisciplineRecord>>(
            result.Body,
            options
        ) ?? new List<SupabaseStudentDisciplineRecord>();

        var response = records.Select(item => new StudentDisciplineDto
        {
            StudentUserId = item.StudentUserId,
            IdStudent = item.IdStudent,

            IdGroup = item.IdGroup,
            GroupName = item.GroupName,
            CourseNo = item.CourseNo,

            IdProgram = item.IdProgram,
            ProgramName = item.ProgramName,

            IdDiscipline = item.IdDiscipline,
            DisciplineName = item.DisciplineName,

            StartModuleNo = item.StartModuleNo,
            EndModuleNo = item.EndModuleNo,

            AcademicYear = item.AcademicYear,

            TeachersCount = item.TeachersCount,
            TeachersShortNames = item.TeachersShortNames
        }).ToList();

        return Ok(response);
    }

    private class SupabaseStudentDisciplineRecord
    {
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

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("teachers_count")]
        public int TeachersCount { get; set; }

        [JsonPropertyName("teachers_short_names")]
        public string TeachersShortNames { get; set; } = string.Empty;
    }
}