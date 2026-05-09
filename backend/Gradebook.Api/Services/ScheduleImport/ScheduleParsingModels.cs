namespace Gradebook.Api.Services.ScheduleImport;

public class HseScheduleFile
{
    public string Title { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public int WeekNo { get; set; }

    public DateOnly WeekStart { get; set; }

    public DateOnly WeekEnd { get; set; }

    public byte[] Bytes { get; set; } = Array.Empty<byte>();

    public string FileHash { get; set; } = string.Empty;
}

public class ParsedScheduleFileResult
{
    public List<ParsedScheduleEntry> Entries { get; set; } = new();

    public List<string> Warnings { get; set; } = new();
}

public class ParsedScheduleEntry
{
    public string SheetName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public DateOnly LessonDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public int WeekNo { get; set; }

    public int? ModuleNo { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string? TeacherShortName { get; set; }

    public string? TeacherSurname { get; set; }

    public string? TeacherNameInitial { get; set; }

    public string? TeacherFathernameInitial { get; set; }

    public string SourceCell { get; set; } = string.Empty;

    public string RawText { get; set; } = string.Empty;
}