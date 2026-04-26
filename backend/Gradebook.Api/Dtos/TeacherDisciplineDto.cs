namespace Gradebook.Api.Dtos;

public class TeacherDisciplineDto
{
    public int IdAssignment { get; set; }
    public int TeacherUserId { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;
    public string? PudUrl { get; set; }
    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int CourseNo { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public int StartModuleNo { get; set; }
    public int EndModuleNo { get; set; }
}