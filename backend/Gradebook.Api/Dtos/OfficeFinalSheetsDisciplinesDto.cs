namespace Gradebook.Api.Dtos;

public class OfficeFinalSheetDisciplineDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string? PudUrl { get; set; }

    public List<OfficeFinalSheetProgramOptionDto> Programs { get; set; } = new();

    public List<int> CourseNos { get; set; } = new();

    public List<int> ModuleNos { get; set; } = new();

    public int GroupsCount { get; set; }

    public int StudentsCount { get; set; }

    public int FinalSheetsCount { get; set; }

    public int SubmittedSheetsCount { get; set; }

    public int ApprovedSheetsCount { get; set; }

    public int FilledFinalGradesCount { get; set; }

    public int FailedStudentsCount { get; set; }

    public decimal? FilledPercent { get; set; }
}

public class OfficeFinalSheetProgramOptionDto
{
    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;
}