namespace Gradebook.Api.Dtos;

public class StudentDisciplineDetailsDto
{
    public int StudentUserId { get; set; }

    public int IdStudent { get; set; }

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string? PudUrl { get; set; }

    public int? StartModuleNo { get; set; }

    public int? EndModuleNo { get; set; }

    public string AcademicYear { get; set; } = string.Empty;

    public int IdAssignment { get; set; }

    public string FormulaText { get; set; } = string.Empty;

    public int TeachersCount { get; set; }

    public string TeachersShortNames { get; set; } = string.Empty;
}