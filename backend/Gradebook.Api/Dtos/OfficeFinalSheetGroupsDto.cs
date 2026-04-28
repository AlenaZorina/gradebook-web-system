namespace Gradebook.Api.Dtos;

public class OfficeFinalSheetGroupDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int StartModuleNo { get; set; }

    public int EndModuleNo { get; set; }

    public int IdAssignment { get; set; }

    public string AcademicYear { get; set; } = string.Empty;

    public string TeacherShortName { get; set; } = string.Empty;

    public int? IdSheet { get; set; }

    public string SheetStatus { get; set; } = string.Empty;

    public int StudentsCount { get; set; }

    public int FilledFinalGradesCount { get; set; }

    public int FailedStudentsCount { get; set; }

    public decimal? FilledPercent { get; set; }
}

public class OfficeFinalSheetDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int IdAssignment { get; set; }

    public string AcademicYear { get; set; } = string.Empty;

    public string TeacherShortName { get; set; } = string.Empty;

    public int? IdSheet { get; set; }

    public string SheetStatus { get; set; } = string.Empty;

    public string FormulaText { get; set; } = string.Empty;

    public List<OfficeFinalSheetElementDto> Elements { get; set; } = new();

    public List<OfficeFinalSheetStudentDto> Students { get; set; } = new();
}

public class OfficeFinalSheetElementDto
{
    public int IdElement { get; set; }

    public string ElementName { get; set; } = string.Empty;

    public string? ControlType { get; set; }

    public decimal? Weight { get; set; }

    public int OrderNo { get; set; }
}

public class OfficeFinalSheetStudentDto
{
    public int IdStudent { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string RecordBookNo { get; set; } = string.Empty;

    public decimal? AccumulatedGrade { get; set; }

    public decimal? ExamGrade { get; set; }

    public decimal? FinalGrade { get; set; }

    public List<OfficeFinalSheetStudentGradeDto> Grades { get; set; } = new();
}

public class OfficeFinalSheetStudentGradeDto
{
    public int IdElement { get; set; }

    public decimal? GradeValue { get; set; }
}