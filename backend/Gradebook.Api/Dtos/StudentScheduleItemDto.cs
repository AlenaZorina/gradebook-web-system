namespace Gradebook.Api.Dtos;

public class StudentScheduleItemDto
{
    public int IdEntry { get; set; }

    public int StudentUserId { get; set; }
    public int IdStudent { get; set; }

    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int CourseNo { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;

    public string TeacherShortName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Position { get; set; }

    public string LessonDate { get; set; } = string.Empty;
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }

    public int? ModuleNo { get; set; }
    public int? WeekNo { get; set; }
}