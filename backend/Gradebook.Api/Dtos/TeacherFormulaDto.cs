namespace Gradebook.Api.Dtos;

public class TeacherFormulaElementDto
{
    public int? IdElement { get; set; }

    public string ElementName { get; set; } = string.Empty;

    public decimal Weight { get; set; }

    public int OrderNo { get; set; }

    public string ControlType { get; set; } = "custom";
}

public class UpdateTeacherFormulaRequestDto
{
    public List<TeacherFormulaElementDto> Elements { get; set; } = new();
}

public class TeacherFormulaResponseDto
{
    public string FormulaText { get; set; } = string.Empty;

    public List<TeacherFormulaElementDto> Elements { get; set; } = new();
}