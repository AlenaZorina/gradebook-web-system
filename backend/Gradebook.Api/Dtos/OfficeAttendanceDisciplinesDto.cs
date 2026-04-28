namespace Gradebook.Api.Dtos;

public class OfficeAttendanceDisciplineDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string? PudUrl { get; set; }

    public List<OfficeAttendanceProgramOptionDto> Programs { get; set; } = new();

    public List<int> CourseNos { get; set; } = new();

    public List<int> ModuleNos { get; set; } = new();

    public int GroupsCount { get; set; }

    public int StudentsCount { get; set; }

    public int SessionsCount { get; set; }

    public int MarkedAttendanceCount { get; set; }

    public int PresentAttendanceCount { get; set; }

    public int AbsentAttendanceCount { get; set; }

    public decimal? AttendancePercent { get; set; }
}

public class OfficeAttendanceProgramOptionDto
{
    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;
}