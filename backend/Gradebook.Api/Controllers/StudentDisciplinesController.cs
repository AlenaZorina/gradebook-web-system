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
            "student_disciplines_view"
            + "?select=student_user_id,id_student,id_group,group_name,course_no,id_program,program_name,id_discipline,discipline_name,start_module_no,end_module_no,academic_year,teachers_count,teachers_short_names"
            + $"&student_user_id=eq.{idUser}"
            + "&order=course_no.asc,discipline_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения дисциплин студента из Supabase",
                    details = result.Body
                }
            );
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

    [HttpGet("{idUser:int}/student-disciplines/{disciplineId:int}")]
    public async Task<ActionResult<StudentDisciplineDetailsDto>> GetStudentDisciplineDetails(
        int idUser,
        int disciplineId
    )
    {
        var query =
            "student_discipline_detail_view"
            + "?select=student_user_id,id_student,id_group,group_name,course_no,id_program,program_name,id_discipline,discipline_name,pud_url,start_module_no,end_module_no,academic_year,id_assignment,formula_text,teachers_count,teachers_short_names"
            + $"&student_user_id=eq.{idUser}"
            + $"&id_discipline=eq.{disciplineId}"
            + "&limit=1";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения деталей дисциплины студента из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseStudentDisciplineDetailsRecord>>(
            result.Body,
            options
        ) ?? new List<SupabaseStudentDisciplineDetailsRecord>();

        var item = records.FirstOrDefault();

        if (item is null)
        {
            return NotFound(new { message = "Дисциплина для студента не найдена" });
        }

        var response = new StudentDisciplineDetailsDto
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
            PudUrl = item.PudUrl,
            StartModuleNo = item.StartModuleNo,
            EndModuleNo = item.EndModuleNo,
            AcademicYear = item.AcademicYear,
            IdAssignment = item.IdAssignment,
            FormulaText = item.FormulaText,
            TeachersCount = item.TeachersCount,
            TeachersShortNames = item.TeachersShortNames
        };

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

    private class SupabaseStudentDisciplineDetailsRecord
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

        [JsonPropertyName("pud_url")]
        public string? PudUrl { get; set; }

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("formula_text")]
        public string FormulaText { get; set; } = string.Empty;

        [JsonPropertyName("teachers_count")]
        public int TeachersCount { get; set; }

        [JsonPropertyName("teachers_short_names")]
        public string TeachersShortNames { get; set; } = string.Empty;
    }
}