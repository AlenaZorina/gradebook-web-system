namespace Gradebook.Api.Dtos;

public class TeacherAttendanceDto
{
    public int TeacherUserId { get; set; }

    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public List<AttendanceSessionDto> Sessions { get; set; } = new();
    public List<AttendanceStudentDto> Students { get; set; } = new();
}

public class AttendanceSessionDto
{
    public int IdSession { get; set; }
    public string LessonDate { get; set; } = string.Empty;
    public string DateLabel { get; set; } = string.Empty;
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
}

public class AttendanceStudentDto
{
    public int IdStudent { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string RecordBookNo { get; set; } = string.Empty;
    public List<AttendanceMarkDto> Marks { get; set; } = new();
}

public class AttendanceMarkDto
{
    public int IdSession { get; set; }
    public string Status { get; set; } = string.Empty;
}