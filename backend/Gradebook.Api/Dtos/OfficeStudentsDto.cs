namespace Gradebook.Api.Dtos;

public class OfficeStudentDto
{
    public int IdStudent { get; set; }

    public int IdUser { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Fathername { get; set; }

    public string RecordBookNo { get; set; } = string.Empty;

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int? IdStatus { get; set; }

    public string? StudentStatus { get; set; }
}

public class OfficeStudentDetailsDto
{
    public int IdStudent { get; set; }

    public int IdUser { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Fathername { get; set; }

    public string RecordBookNo { get; set; } = string.Empty;

    public string? Email { get; set; }

    public int IdGroup { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public int IdProgram { get; set; }

    public string ProgramName { get; set; } = string.Empty;

    public int? IdStatus { get; set; }

    public string? StudentStatus { get; set; }
}

public class OfficeStudentAttendanceDisciplineDto
{
    public int IdStudent { get; set; }

    public int IdDiscipline { get; set; }

    public string DisciplineName { get; set; } = string.Empty;

    public string? PudUrl { get; set; }

    public int IdEnrollment { get; set; }

    public int CourseNo { get; set; }

    public List<int> ModuleNos { get; set; } = new();

    public int IdAssignment { get; set; }

    public string AcademicYear { get; set; } = string.Empty;

    public int SessionsCount { get; set; }

    public int MarkedAttendanceCount { get; set; }

    public int PresentAttendanceCount { get; set; }

    public int AbsenceCount { get; set; }

    public decimal? AttendancePercent { get; set; }
}