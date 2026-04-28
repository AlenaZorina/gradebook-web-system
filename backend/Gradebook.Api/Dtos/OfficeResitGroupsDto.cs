namespace Gradebook.Api.Dtos;

public class OfficeResitGroupDto
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

    public int RetakeStudentsCount { get; set; }
}

public class OfficeResitStudentListDto
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

    public int RetakeStudentsCount { get; set; }

    public List<OfficeResitStudentDto> Students { get; set; } = new();
}

public class OfficeResitStudentDto
{
    public int IdStudent { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string RecordBookNo { get; set; } = string.Empty;

    public string ProgramName { get; set; } = string.Empty;

    public string GroupName { get; set; } = string.Empty;

    public decimal FinalGrade { get; set; }
}