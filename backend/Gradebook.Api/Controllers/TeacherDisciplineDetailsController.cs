using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

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

        var formula = await LoadDisciplineFormulaAsync(
    records.Select(item => item.IdAssignment).Distinct().ToList()
);

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

            FormulaText = formula.FormulaText ?? selectedRecord.FormulaText,
            FormulaElements = formula.Elements,
            PudUrl = selectedRecord.PudUrl,

            Groups = groups
        };

        return Ok(response);
    }

    [HttpPut("{idUser:int}/teacher-disciplines/{disciplineId:int}/details/{idAssignment:int}/formula")]
public async Task<ActionResult<TeacherFormulaResponseDto>> UpdateFormula(
    int idUser,
    int disciplineId,
    int idAssignment,
    [FromBody] UpdateTeacherFormulaRequestDto request
)
{
    if (request.Elements.Count == 0)
    {
        return BadRequest(new
        {
            message = "Формула должна содержать хотя бы один элемент контроля"
        });
    }

    var cleanedElements = request.Elements
        .Select((item, index) => new TeacherFormulaElementDto
        {
            IdElement = item.IdElement,
            ElementName = item.ElementName.Trim(),
            Weight = item.Weight,
            OrderNo = index + 1,
            ControlType = string.IsNullOrWhiteSpace(item.ControlType)
                ? "custom"
                : item.ControlType.Trim()
        })
        .ToList();

    if (cleanedElements.Any(item => string.IsNullOrWhiteSpace(item.ElementName)))
    {
        return BadRequest(new
        {
            message = "Название элемента контроля не может быть пустым"
        });
    }

    if (cleanedElements.Any(item => item.Weight <= 0))
    {
        return BadRequest(new
        {
            message = "Вес элемента контроля должен быть больше 0"
        });
    }

    var formulaText = BuildFormulaText(cleanedElements);

    var payload = new
    {
        p_teacher_user_id = idUser,
        p_id_assignment = idAssignment,
        p_formula_text = formulaText,
        p_elements = cleanedElements.Select(item => new
        {
            idElement = item.IdElement,
            elementName = item.ElementName,
            weight = item.Weight,
            orderNo = item.OrderNo,
            controlType = item.ControlType
        }).ToList()
    };

    var result = await _supabase.RpcAsync("update_teacher_grading_formula", payload);

    if (!result.Success)
    {
        return StatusCode(result.StatusCode, new
        {
            message = "Ошибка сохранения формулы оценивания",
            details = result.Body
        });
    }

    var options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    var response = JsonSerializer.Deserialize<TeacherFormulaResponseDto>(
        result.Body,
        options
    );

    return Ok(response ?? new TeacherFormulaResponseDto
    {
        FormulaText = formulaText,
        Elements = cleanedElements
    });
}

private async Task<TeacherFormulaResponseDto> LoadDisciplineFormulaAsync(
    List<int> assignmentIds
)
{
    if (assignmentIds.Count == 0)
    {
        return new TeacherFormulaResponseDto();
    }

    var ids = string.Join(",", assignmentIds);

    var query = "grading_formulas"
        + "?select=id_formula,id_assignment,formula_text,updated_at,control_elements(id_element,element_name,weight,order_no,control_type)"
        + $"&id_assignment=in.({ids})"
        + "&order=updated_at.desc"
        + "&limit=1";

    var result = await _supabase.GetAsync(query);

    if (!result.Success)
    {
        return new TeacherFormulaResponseDto();
    }

    var options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    var records = JsonSerializer.Deserialize<List<SupabaseFormulaRecord>>(
        result.Body,
        options
    ) ?? new List<SupabaseFormulaRecord>();

    var formula = records.FirstOrDefault();

    if (formula is null)
    {
        return new TeacherFormulaResponseDto();
    }

    return new TeacherFormulaResponseDto
    {
        FormulaText = formula.FormulaText ?? string.Empty,
        Elements = formula.ControlElements
            .OrderBy(item => item.OrderNo)
            .Select(item => new TeacherFormulaElementDto
            {
                IdElement = item.IdElement,
                ElementName = item.ElementName,
                Weight = item.Weight,
                OrderNo = item.OrderNo,
                ControlType = item.ControlType ?? "custom"
            })
            .ToList()
    };
}

private static string BuildFormulaText(List<TeacherFormulaElementDto> elements)
{
    return string.Join(
        " + ",
        elements
            .OrderBy(item => item.OrderNo)
            .Select(item =>
                $"{FormatWeight(item.Weight)}*{item.ElementName.Trim()}"
            )
    );
}

private static string FormatWeight(decimal value)
{
    return value.ToString("0.####", CultureInfo.InvariantCulture);
}

private class SupabaseFormulaRecord
{
    [JsonPropertyName("id_formula")]
    public int IdFormula { get; set; }

    [JsonPropertyName("id_assignment")]
    public int IdAssignment { get; set; }

    [JsonPropertyName("formula_text")]
    public string? FormulaText { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }

    [JsonPropertyName("control_elements")]
    public List<SupabaseControlElementRecord> ControlElements { get; set; } = new();
}

private class SupabaseControlElementRecord
{
    [JsonPropertyName("id_element")]
    public int IdElement { get; set; }

    [JsonPropertyName("element_name")]
    public string ElementName { get; set; } = string.Empty;

    [JsonPropertyName("weight")]
    public decimal Weight { get; set; }

    [JsonPropertyName("order_no")]
    public int OrderNo { get; set; }

    [JsonPropertyName("control_type")]
    public string? ControlType { get; set; }
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