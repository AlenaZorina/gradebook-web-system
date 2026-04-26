using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherDisciplineDetailsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public TeacherDisciplineDetailsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/teacher-disciplines/{disciplineId:int}/details")]
    public async Task<ActionResult<TeacherDisciplineDetailDto>> GetDisciplineDetails(
        int idUser,
        int disciplineId,
        [FromQuery] int? groupId)
    {
        var query =
            "teacher_discipline_detail_view" +
            "?select=id_assignment,teacher_user_id,id_discipline,discipline_name,pud_url,id_group,group_name,course_no,program_name,start_module_no,end_module_no,academic_year,formula_text" +
            $"&teacher_user_id=eq.{idUser}" +
            $"&id_discipline=eq.{disciplineId}" +
            "&order=group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка получения деталей дисциплины из Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseDisciplineDetailRecord>>(result.Body, options)
                      ?? new List<SupabaseDisciplineDetailRecord>();

        if (records.Count == 0)
        {
            return NotFound(new { message = "Дисциплина для преподавателя не найдена" });
        }

        var selectedRecord = groupId.HasValue
            ? records.FirstOrDefault(item => item.IdGroup == groupId.Value) ?? records.First()
            : records.First();

        var groups = records
            .GroupBy(item => new { item.IdGroup, item.GroupName })
            .Select(group => new DisciplineGroupOptionDto
            {
                IdGroup = group.Key.IdGroup,
                GroupName = group.Key.GroupName
            })
            .OrderBy(group => group.GroupName)
            .ToList();

        var response = new TeacherDisciplineDetailDto
        {
            IdAssignment = selectedRecord.IdAssignment,
            TeacherUserId = selectedRecord.TeacherUserId,

            IdDiscipline = selectedRecord.IdDiscipline,
            DisciplineName = selectedRecord.DisciplineName,

            CourseNo = selectedRecord.CourseNo,
            ProgramName = selectedRecord.ProgramName,
            AcademicYear = selectedRecord.AcademicYear,

            SelectedGroupId = selectedRecord.IdGroup,
            SelectedGroupName = selectedRecord.GroupName,

            StartModuleNo = selectedRecord.StartModuleNo,
            EndModuleNo = selectedRecord.EndModuleNo,

            FormulaText = selectedRecord.FormulaText,
            PudUrl = selectedRecord.PudUrl,

            Groups = groups
        };

        return Ok(response);
    }

    private class SupabaseDisciplineDetailRecord
    {
        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

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

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("formula_text")]
        public string FormulaText { get; set; } = string.Empty;
    }
}