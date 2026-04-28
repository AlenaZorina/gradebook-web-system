using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class StudentGradebookController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public StudentGradebookController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/student-gradebook")]
    public async Task<ActionResult<StudentGradebookDto>> GetStudentGradebook(
        int idUser,
        [FromQuery] int? disciplineId
    )
    {
        if (!disciplineId.HasValue)
        {
            return BadRequest(new { message = "Необходимо выбрать дисциплину" });
        }

        var query =
            "student_gradebook_view"
            + "?select=student_user_id,id_student,id_assignment,id_sheet,sheet_status,id_discipline,discipline_name,id_group,group_name,course_no,program_name,academic_year,formula_text,id_element,element_name,weight,element_order_no,control_type,id_grade,grade_value,id_final_grade,final_grade"
            + $"&student_user_id=eq.{idUser}"
            + $"&id_discipline=eq.{disciplineId.Value}"
            + "&order=element_order_no.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения ведомости студента из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseStudentGradebookRecord>>(
            result.Body,
            options
        ) ?? new List<SupabaseStudentGradebookRecord>();

        if (records.Count == 0)
        {
            return NotFound(new { message = "Ведомость по выбранной дисциплине не найдена" });
        }

        var first = records.First();

        var elements = records
            .Where(item => item.IdElement.HasValue)
            .GroupBy(item => new
            {
                IdElement = item.IdElement!.Value,
                item.ElementName,
                item.ElementOrderNo,
                item.ControlType,
                item.Weight
            })
            .Select(group =>
            {
                var gradeRecord = group.FirstOrDefault();

                return new StudentGradebookElementDto
                {
                    IdElement = group.Key.IdElement,
                    ElementName = group.Key.ElementName ?? string.Empty,
                    OrderNo = group.Key.ElementOrderNo ?? 0,
                    ControlType = group.Key.ControlType,
                    Weight = group.Key.Weight,
                    GradeValue = gradeRecord?.GradeValue,
                    DateLabel = "—"
                };
            })
            .OrderBy(item => item.OrderNo)
            .ToList();

        var accumulatedGrade = CalculateAccumulatedGrade(elements);
        var examGrade = CalculateExamGrade(elements);
        var preliminaryFinalGrade = CalculatePreliminaryFinalGrade(elements);

        var response = new StudentGradebookDto
        {
            StudentUserId = first.StudentUserId,
            IdStudent = first.IdStudent,
            IdAssignment = first.IdAssignment,
            IdSheet = first.IdSheet,
            SheetStatus = first.SheetStatus ?? string.Empty,
            IdDiscipline = first.IdDiscipline,
            DisciplineName = first.DisciplineName,
            IdGroup = first.IdGroup,
            GroupName = first.GroupName,
            CourseNo = first.CourseNo,
            ProgramName = first.ProgramName,
            AcademicYear = first.AcademicYear,
            FormulaText = first.FormulaText ?? "Формула пока не указана",
            AccumulatedGrade = accumulatedGrade,
            ExamGrade = examGrade,
            PreliminaryFinalGrade = first.FinalGrade ?? preliminaryFinalGrade,
            FinalGrade = first.FinalGrade,
            Elements = elements
        };

        return Ok(response);
    }

    private static decimal? CalculateAccumulatedGrade(List<StudentGradebookElementDto> elements)
    {
        var nonExamElements = elements
            .Where(item => !IsExamElement(item))
            .Where(item => item.GradeValue.HasValue)
            .ToList();

        return CalculateWeightedAverage(nonExamElements);
    }

    private static decimal? CalculateExamGrade(List<StudentGradebookElementDto> elements)
    {
        var examElement = elements.FirstOrDefault(IsExamElement);
        return examElement?.GradeValue;
    }

    private static decimal? CalculatePreliminaryFinalGrade(List<StudentGradebookElementDto> elements)
    {
        var filledElements = elements
            .Where(item => item.GradeValue.HasValue)
            .ToList();

        return CalculateWeightedAverage(filledElements);
    }

    private static decimal? CalculateWeightedAverage(List<StudentGradebookElementDto> elements)
    {
        if (elements.Count == 0)
        {
            return null;
        }

        var elementsWithWeight = elements
            .Where(item => item.Weight.HasValue && item.Weight.Value > 0)
            .ToList();

        if (elementsWithWeight.Count > 0)
        {
            var weightSum = elementsWithWeight.Sum(item => item.Weight!.Value);

            if (weightSum > 0)
            {
                var weightedSum = elementsWithWeight.Sum(
                    item => item.GradeValue!.Value * item.Weight!.Value
                );

                return Math.Round(weightedSum / weightSum, 2);
            }
        }

        var average = elements.Average(item => item.GradeValue!.Value);
        return Math.Round(average, 2);
    }

    private static bool IsExamElement(StudentGradebookElementDto element)
    {
        var name = element.ElementName.ToLowerInvariant();
        var type = element.ControlType?.ToLowerInvariant() ?? string.Empty;

        return name.Contains("экз")
            || name.Contains("экзамен")
            || type.Contains("exam")
            || type.Contains("экз")
            || type.Contains("экзамен");
    }

    private class SupabaseStudentGradebookRecord
    {
        [JsonPropertyName("student_user_id")]
        public int StudentUserId { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

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

        [JsonPropertyName("formula_text")]
        public string? FormulaText { get; set; }

        [JsonPropertyName("id_element")]
        public int? IdElement { get; set; }

        [JsonPropertyName("element_name")]
        public string? ElementName { get; set; }

        [JsonPropertyName("weight")]
        public decimal? Weight { get; set; }

        [JsonPropertyName("element_order_no")]
        public int? ElementOrderNo { get; set; }

        [JsonPropertyName("control_type")]
        public string? ControlType { get; set; }

        [JsonPropertyName("id_grade")]
        public int? IdGrade { get; set; }

        [JsonPropertyName("grade_value")]
        public decimal? GradeValue { get; set; }

        [JsonPropertyName("id_final_grade")]
        public int? IdFinalGrade { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }
}