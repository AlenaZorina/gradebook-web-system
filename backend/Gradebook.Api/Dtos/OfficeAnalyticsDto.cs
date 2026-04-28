namespace Gradebook.Api.Dtos;

public class OfficeAnalyticsDto
{
    public int ProgramsCount { get; set; }

    public int DisciplinesCount { get; set; }

    public int GroupsCount { get; set; }

    public int StudentsCount { get; set; }

    public int ActiveStudentsCount { get; set; }

    public int TotalLessons { get; set; }

    public decimal? AverageAttendancePercent { get; set; }

    public decimal? AverageFinalGrade { get; set; }

    public int FailedStudentsCount { get; set; }

    public int AtRiskStudentsCount { get; set; }

    public int FilledFinalGradesCount { get; set; }

    public int ApprovedSheetsCount { get; set; }

    public int SubmittedSheetsCount { get; set; }

    public int DraftSheetsCount { get; set; }

    public OfficeAnalyticsFilterOptionsDto FilterOptions { get; set; } = new();

    public List<OfficeAnalyticsAttendancePointDto> AttendanceByDate { get; set; } = new();

    public List<OfficeAnalyticsGradeDistributionDto> GradeDistribution { get; set; } = new();

    public List<OfficeAnalyticsProgramComparisonDto> ProgramComparison { get; set; } = new();

    public List<OfficeAnalyticsDisciplineComparisonDto> DisciplineComparison { get; set; } = new();

    public List<OfficeAnalyticsGroupComparisonDto> GroupComparison { get; set; } = new();

    public List<OfficeAnalyticsStatusDistributionDto> StudentStatusDistribution { get; set; } = new();

    public List<OfficeAnalyticsRiskStudentDto> RiskStudents { get; set; } = new();
}

public class OfficeAnalyticsFilterOptionsDto
{
    public List<OfficeAnalyticsProgramOptionDto> Programs { get; set; } = new();

    public List<int> CourseNos { get; set; } = new();

    public List<int> ModuleNos { get; set; } = new();
}

public class OfficeAnalyticsProgramOptionDto
{
    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;
}

public class OfficeAnalyticsAttendancePointDto
{
    public string LessonDate { get; set; } = string.Empty;

    public string DateLabel { get; set; } = string.Empty;

    public int PresentCount { get; set; }

    public int AbsentCount { get; set; }

    public int TotalStudents { get; set; }

    public decimal? AttendancePercent { get; set; }
}

public class OfficeAnalyticsGradeDistributionDto
{
    public string Label { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class OfficeAnalyticsProgramComparisonDto
{
    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int StudentsCount { get; set; }

    public int GroupsCount { get; set; }

    public decimal? AverageAttendancePercent { get; set; }

    public decimal? AverageFinalGrade { get; set; }

    public int AtRiskStudentsCount { get; set; }
}

public class OfficeAnalyticsDisciplineComparisonDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int GroupsCount { get; set; }

    public int StudentsCount { get; set; }

    public decimal? AverageAttendancePercent { get; set; }

    public decimal? AverageFinalGrade { get; set; }

    public int FailedStudentsCount { get; set; }

    public int AtRiskStudentsCount { get; set; }
}

public class OfficeAnalyticsGroupComparisonDto
{
    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int StudentsCount { get; set; }

    public decimal? AverageAttendancePercent { get; set; }

    public decimal? AverageFinalGrade { get; set; }

    public int AtRiskStudentsCount { get; set; }
}

public class OfficeAnalyticsStatusDistributionDto
{
    public string StatusName { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class OfficeAnalyticsRiskStudentDto
{
    public int IdStudent { get; set; }

    public string FullName { get; set; } = string.Empty;

    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public decimal? AttendancePercent { get; set; }

    public decimal? FinalGrade { get; set; }

    public int MissingGradesCount { get; set; }

    public string RiskReason { get; set; } = string.Empty;
}