namespace Gradebook.Api.Dtos;

public class TeacherScheduleItemDto
{
    public int IdEntry { get; set; }
    public int TeacherUserId { get; set; }
    public string TeacherShortName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Position { get; set; }
    public DateOnly LessonDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public int? WeekNo { get; set; }
    public int? ModuleNo { get; set; }
    public string DisciplineName { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
}