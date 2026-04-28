namespace Gradebook.Api.Dtos;

public class StudentGradebookDto
{
    public int StudentUserId { get; set; }

    public int IdStudent { get; set; }

    public int IdAssignment { get; set; }

    public int? IdSheet { get; set; }

    public string SheetStatus { get; set; } = string.Empty;

    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public string AcademicYear { get; set; } = string.Empty;

    public string FormulaText { get; set; } = string.Empty;

    public decimal? AccumulatedGrade { get; set; }

    public decimal? ExamGrade { get; set; }

    public decimal? PreliminaryFinalGrade { get; set; }

    public decimal? FinalGrade { get; set; }

    public List<StudentGradebookElementDto> Elements { get; set; } = new();
}

public class StudentGradebookElementDto
{
    public int IdElement { get; set; }

    public string ElementName { get; set; } = string.Empty;

    public int OrderNo { get; set; }

    public string? ControlType { get; set; }

    public decimal? Weight { get; set; }

    public decimal? GradeValue { get; set; }

    public string DateLabel { get; set; } = "—";
}