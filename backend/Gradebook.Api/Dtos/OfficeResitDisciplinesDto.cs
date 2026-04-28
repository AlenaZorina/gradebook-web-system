namespace Gradebook.Api.Dtos;

public class OfficeResitDisciplineDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string? PudUrl { get; set; }

    public List<OfficeProgramOptionDto> Programs { get; set; } = new();

    public List<int> CourseNos { get; set; } = new();

    public List<int> ModuleNos { get; set; } = new();

    public int GroupsCount { get; set; }

    public int StudentsCount { get; set; }

    public int RetakeStudentsCount { get; set; }
}

public class OfficeProgramOptionDto
{
    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;
}