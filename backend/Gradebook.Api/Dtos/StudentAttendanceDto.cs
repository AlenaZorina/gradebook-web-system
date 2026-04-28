namespace Gradebook.Api.Dtos;

public class StudentAttendanceDto
{
    public int StudentUserId { get; set; }

    public int IdStudent { get; set; }

    public int IdAssignment { get; set; }

    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public string AcademicYear { get; set; } = string.Empty;

    public int? AttendancePercent { get; set; }

    public List<StudentAttendanceSessionDto> Sessions { get; set; } = new();
}

public class StudentAttendanceSessionDto
{
    public int IdSession { get; set; }

    public string LessonDate { get; set; } = string.Empty;

    public string DateLabel { get; set; } = string.Empty;

    public string? StartTime { get; set; }

    public string? EndTime { get; set; }

    public string Status { get; set; } = string.Empty;
}