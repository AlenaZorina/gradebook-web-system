namespace Gradebook.Api.Dtos;

public class OfficeAttendanceGroupDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int StartModuleNo { get; set; }

    public int EndModuleNo { get; set; }

    public int IdAssignment { get; set; }

    public string AcademicYear { get; set; } = string.Empty;

    public string TeacherShortName { get; set; } = string.Empty;

    public int StudentsCount { get; set; }

    public int SessionsCount { get; set; }

    public int MarkedAttendanceCount { get; set; }

    public int PresentAttendanceCount { get; set; }

    public int AbsentAttendanceCount { get; set; }

    public decimal? AttendancePercent { get; set; }
}

public class OfficeAttendanceSheetDto
{
    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int IdAssignment { get; set; }

    public string AcademicYear { get; set; } = string.Empty;

    public string TeacherShortName { get; set; } = string.Empty;

    public decimal? AttendancePercent { get; set; }

    public List<OfficeAttendanceSessionDto> Sessions { get; set; } = new();

    public List<OfficeAttendanceStudentDto> Students { get; set; } = new();
}

public class OfficeAttendanceSessionDto
{
    public int IdSession { get; set; }

    public string LessonDate { get; set; } = string.Empty;

    public string DateLabel { get; set; } = string.Empty;

    public string? StartTime { get; set; }

    public string? EndTime { get; set; }
}

public class OfficeAttendanceStudentDto
{
    public int IdStudent { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string RecordBookNo { get; set; } = string.Empty;

    public List<OfficeAttendanceStudentStatusDto> Attendance { get; set; } = new();
}

public class OfficeAttendanceStudentStatusDto
{
    public int IdSession { get; set; }

    public string Status { get; set; } = string.Empty;
}