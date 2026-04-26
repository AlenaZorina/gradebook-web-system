namespace Gradebook.Api.Dtos;

public class TeacherAnalyticsDto
{
    public int TeacherUserId { get; set; }

    public int DisciplinesCount { get; set; }
    public int GroupsCount { get; set; }
    public int StudentsCount { get; set; }
    public int TotalLessons { get; set; }

    public decimal? AverageAttendancePercent { get; set; }
    public decimal? AverageFinalGrade { get; set; }

    public int AtRiskStudentsCount { get; set; }
    public int FilledFinalGradesCount { get; set; }
    public int SubmittedSheetsCount { get; set; }
    public int DraftSheetsCount { get; set; }

    public List<AnalyticsAttendancePointDto> AttendanceByDate { get; set; } = new();
    public List<AnalyticsGradeDistributionDto> GradeDistribution { get; set; } = new();
    public List<AnalyticsDisciplineComparisonDto> DisciplineComparison { get; set; } = new();
    public List<AnalyticsRiskStudentDto> RiskStudents { get; set; } = new();
}

public class AnalyticsAttendancePointDto
{
    public string LessonDate { get; set; } = string.Empty;
    public string DateLabel { get; set; } = string.Empty;
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int TotalStudents { get; set; }
    public decimal? AttendancePercent { get; set; }
}

public class AnalyticsGradeDistributionDto
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AnalyticsDisciplineComparisonDto
{
    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }
    public int StudentsCount { get; set; }

    public decimal? AverageAttendancePercent { get; set; }
    public decimal? AverageFinalGrade { get; set; }

    public int AtRiskStudentsCount { get; set; }
}

public class AnalyticsRiskStudentDto
{
    public int IdStudent { get; set; }
    public string FullName { get; set; } = string.Empty;

    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public decimal? AttendancePercent { get; set; }
    public decimal? FinalGrade { get; set; }
    public int MissingGradesCount { get; set; }

    public string RiskReason { get; set; } = string.Empty;
}