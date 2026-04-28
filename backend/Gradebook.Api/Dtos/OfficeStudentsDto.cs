namespace Gradebook.Api.Dtos;

public class OfficeStudentDto
{
    public int IdStudent { get; set; }

    public int IdUser { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Fathername { get; set; }

    public string RecordBookNo { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int? IdStatus { get; set; }

    public string? StudentStatus { get; set; }
}