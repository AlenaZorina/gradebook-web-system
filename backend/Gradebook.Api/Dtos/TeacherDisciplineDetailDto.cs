namespace Gradebook.Api.Dtos;

public class TeacherDisciplineDetailDto
{
    public int IdAssignment { get; set; }
    public int TeacherUserId { get; set; }

    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;

    public int CourseNo { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;

    public int SelectedGroupId { get; set; }
    public string SelectedGroupName { get; set; } = string.Empty;

    public int StartModuleNo { get; set; }
    public int EndModuleNo { get; set; }

    public string FormulaText { get; set; } = string.Empty;
    public string? PudUrl { get; set; }

    public List<DisciplineGroupOptionDto> Groups { get; set; } = new();
    public List<TeacherFormulaElementDto> FormulaElements { get; set; } = new();
}