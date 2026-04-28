using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeFinalSheetGroupsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeFinalSheetGroupsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/final-sheet-disciplines/{disciplineId:int}/groups")]
    public async Task<ActionResult<List<OfficeFinalSheetGroupDto>>> GetFinalSheetGroups(
        int idUser,
        int disciplineId
    )
    {
        var query =
            "office_final_sheet_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,students_count,filled_final_grades_count,failed_students_count"
            + $"&id_discipline=eq.{disciplineId}"
            + "&order=group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения групп для итоговых ведомостей из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetGroupRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetGroupRow>();

        var response = rows
            .GroupBy(row => new
            {
                row.IdDiscipline,
                row.DisciplineName,
                row.IdGroup,
                row.GroupName,
                row.CourseNo,
                row.IdProgram,
                row.ProgramName,
                row.StartModuleNo,
                row.EndModuleNo,
                row.IdAssignment,
                row.AcademicYear,
                row.TeacherShortName,
                row.IdSheet,
                row.SheetStatus
            })
            .Select(group =>
            {
                var studentsCount = group.Sum(item => item.StudentsCount);
                var filledFinalGradesCount = group.Sum(item => item.FilledFinalGradesCount);

                decimal? filledPercent = studentsCount == 0
                    ? null
                    : Math.Round((decimal)filledFinalGradesCount / studentsCount * 100m, 1);

                return new OfficeFinalSheetGroupDto
                {
                    IdDiscipline = group.Key.IdDiscipline,
                    DisciplineName = group.Key.DisciplineName,
                    IdGroup = group.Key.IdGroup,
                    GroupName = group.Key.GroupName,
                    CourseNo = group.Key.CourseNo,
                    IdProgram = group.Key.IdProgram,
                    ProgramName = group.Key.ProgramName,
                    StartModuleNo = group.Key.StartModuleNo,
                    EndModuleNo = group.Key.EndModuleNo,
                    IdAssignment = group.Key.IdAssignment,
                    AcademicYear = group.Key.AcademicYear,
                    TeacherShortName = group.Key.TeacherShortName,
                    IdSheet = group.Key.IdSheet,
                    SheetStatus = group.Key.SheetStatus ?? string.Empty,
                    StudentsCount = studentsCount,
                    FilledFinalGradesCount = filledFinalGradesCount,
                    FailedStudentsCount = group.Sum(item => item.FailedStudentsCount),
                    FilledPercent = filledPercent
                };
            })
            .OrderBy(item => item.GroupName)
            .ToList();

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/final-sheet-disciplines/{disciplineId:int}/groups/{groupId:int}/sheet")]
    public async Task<ActionResult<OfficeFinalSheetDto>> GetFinalSheet(
        int idUser,
        int disciplineId,
        int groupId
    )
    {
        var groupQuery =
            "office_final_sheet_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status"
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

        var groupRows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetGroupRow>>(
            groupResult.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetGroupRow>();

        var groupInfo = groupRows.FirstOrDefault();

        if (groupInfo is null)
        {
            return NotFound(new { message = "Группа по выбранной дисциплине не найдена" });
        }

        var sheetQuery =
            "office_final_sheet_rows_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,formula_text,id_element,element_name,control_type,weight,element_order_no,id_student,student_surname,student_name,student_fathername,record_book_no,grade_value,final_grade"
            + $"&id_discipline=eq.{disciplineId}"
            + $"&id_group=eq.{groupId}"
            + "&order=student_surname.asc,student_name.asc,element_order_no.asc";

        var sheetResult = await _supabase.GetAsync(sheetQuery);

        if (!sheetResult.Success)
        {
            return StatusCode(
                sheetResult.StatusCode,
                new
                {
                    message = "Ошибка получения итоговой ведомости из Supabase",
                    details = sheetResult.Body
                }
            );
        }

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetRow>>(
            sheetResult.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetRow>();

        var elements = rows
            .Where(row => row.IdElement.HasValue)
            .GroupBy(row => new
            {
                IdElement = row.IdElement!.Value,
                row.ElementName,
                row.ControlType,
                row.Weight,
                row.ElementOrderNo
            })
            .Select(group => new OfficeFinalSheetElementDto
            {
                IdElement = group.Key.IdElement,
                ElementName = group.Key.ElementName ?? string.Empty,
                ControlType = group.Key.ControlType,
                Weight = group.Key.Weight,
                OrderNo = group.Key.ElementOrderNo ?? 0
            })
            .OrderBy(item => item.OrderNo)
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
            .Select(group =>
            {
                var grades = elements
                    .Select(element =>
                    {
                        var gradeValue = group
                            .FirstOrDefault(row => row.IdElement == element.IdElement)
                            ?.GradeValue;

                        return new OfficeFinalSheetStudentGradeDto
                        {
                            IdElement = element.IdElement,
                            GradeValue = gradeValue
                        };
                    })
                    .ToList();

                var studentElements = elements
                    .Select(element =>
                    {
                        var gradeValue = grades
                            .FirstOrDefault(grade => grade.IdElement == element.IdElement)
                            ?.GradeValue;

                        return new OfficeFinalSheetStudentElementForCalc
                        {
                            ElementName = element.ElementName,
                            ControlType = element.ControlType,
                            Weight = element.Weight,
                            GradeValue = gradeValue
                        };
                    })
                    .ToList();

                var finalGrade = group
                    .Select(row => row.FinalGrade)
                    .FirstOrDefault(value => value.HasValue);

                return new OfficeFinalSheetStudentDto
                {
                    IdStudent = group.Key.IdStudent,
                    FullName = BuildFullName(
                        group.Key.StudentSurname,
                        group.Key.StudentName,
                        group.Key.StudentFathername
                    ),
                    RecordBookNo = group.Key.RecordBookNo ?? string.Empty,
                    AccumulatedGrade = CalculateAccumulatedGrade(studentElements),
                    ExamGrade = CalculateExamGrade(studentElements),
                    FinalGrade = finalGrade ?? CalculatePreliminaryFinalGrade(studentElements),
                    Grades = grades
                };
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var formulaText = rows
            .Select(row => row.FormulaText)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))
            ?? string.Empty;

        var response = new OfficeFinalSheetDto
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
            IdSheet = groupInfo.IdSheet,
            SheetStatus = groupInfo.SheetStatus ?? string.Empty,
            FormulaText = formulaText,
            Elements = elements,
            Students = students
        };

        return Ok(response);
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private static decimal? CalculateAccumulatedGrade(List<OfficeFinalSheetStudentElementForCalc> elements)
    {
        var nonExamElements = elements
            .Where(item => !IsExamElement(item))
            .Where(item => item.GradeValue.HasValue)
            .ToList();

        return CalculateWeightedAverage(nonExamElements);
    }

    private static decimal? CalculateExamGrade(List<OfficeFinalSheetStudentElementForCalc> elements)
    {
        var examElement = elements.FirstOrDefault(IsExamElement);
        return examElement?.GradeValue;
    }

    private static decimal? CalculatePreliminaryFinalGrade(List<OfficeFinalSheetStudentElementForCalc> elements)
    {
        var filledElements = elements
            .Where(item => item.GradeValue.HasValue)
            .ToList();

        return CalculateWeightedAverage(filledElements);
    }

    private static decimal? CalculateWeightedAverage(List<OfficeFinalSheetStudentElementForCalc> elements)
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

    private static bool IsExamElement(OfficeFinalSheetStudentElementForCalc element)
    {
        var name = element.ElementName.ToLowerInvariant();
        var type = element.ControlType?.ToLowerInvariant() ?? string.Empty;

        return name.Contains("экз")
            || name.Contains("экзамен")
            || type.Contains("exam")
            || type.Contains("экз")
            || type.Contains("экзамен");
    }

    private class OfficeFinalSheetStudentElementForCalc
    {
        public string ElementName { get; set; } = string.Empty;

        public string? ControlType { get; set; }

        public decimal? Weight { get; set; }

        public decimal? GradeValue { get; set; }
    }

    private class SupabaseOfficeFinalSheetGroupRow
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

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

        [JsonPropertyName("students_count")]
        public int StudentsCount { get; set; }

        [JsonPropertyName("filled_final_grades_count")]
        public int FilledFinalGradesCount { get; set; }

        [JsonPropertyName("failed_students_count")]
        public int FailedStudentsCount { get; set; }
    }

    private class SupabaseOfficeFinalSheetRow
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
        public string? RecordBookNo { get; set; }

        [JsonPropertyName("id_element")]
        public int? IdElement { get; set; }

        [JsonPropertyName("element_name")]
        public string? ElementName { get; set; }

        [JsonPropertyName("control_type")]
        public string? ControlType { get; set; }

        [JsonPropertyName("weight")]
        public decimal? Weight { get; set; }

        [JsonPropertyName("element_order_no")]
        public int? ElementOrderNo { get; set; }

        [JsonPropertyName("grade_value")]
        public decimal? GradeValue { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }

        [JsonPropertyName("formula_text")]
        public string? FormulaText { get; set; }
    }
}