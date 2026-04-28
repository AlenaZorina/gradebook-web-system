namespace Gradebook.Api.Dtos;

public class StudentAnalyticsDto
{
    public int StudentUserId { get; set; }

    public int IdStudent { get; set; }

    public string StudentFullName { get; set; } = string.Empty;

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int DisciplinesCount { get; set; }

    public int TotalLessons { get; set; }

    public decimal? AverageAttendancePercent { get; set; }

    public decimal? AverageGrade { get; set; }

    public decimal? PreliminaryFinalGrade { get; set; }

    public int FilledGradesCount { get; set; }

    public int TotalGradesCount { get; set; }

    public int MissingGradesCount { get; set; }

    public bool HasRisk { get; set; }

    public string RiskReason { get; set; } = string.Empty;

    public List<StudentAnalyticsAttendancePointDto> AttendanceByDate { get; set; } = new();

    public List<StudentAnalyticsGradePointDto> GradeProgress { get; set; } = new();

    public List<StudentAnalyticsGradeDistributionDto> GradeDistribution { get; set; } = new();

    public List<StudentAnalyticsDisciplineSummaryDto> DisciplineSummary { get; set; } = new();
}

public class StudentAnalyticsAttendancePointDto
{
    public string LessonDate { get; set; } = string.Empty;

    public string DateLabel { get; set; } = string.Empty;

    public decimal? AttendancePercent { get; set; }
}

public class StudentAnalyticsGradePointDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string ElementName { get; set; } = string.Empty;

    public decimal? GradeValue { get; set; }

    public int OrderNo { get; set; }
}

public class StudentAnalyticsGradeDistributionDto
{
    public string Label { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class StudentAnalyticsDisciplineSummaryDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public decimal? AttendancePercent { get; set; }

    public decimal? AverageGrade { get; set; }

    public decimal? FinalGrade { get; set; }

    public int MissingGradesCount { get; set; }

    public bool HasRisk { get; set; }

    public string RiskReason { get; set; } = string.Empty;
}