namespace Gradebook.Api.Dtos;

public class UpdateTeacherAttendanceRequestDto
{
    public List<UpdateAttendanceStudentDto> Students { get; set; } = new();
}

public class UpdateAttendanceStudentDto
{
    public int IdStudent { get; set; }
    public List<UpdateAttendanceMarkDto> Marks { get; set; } = new();
}

public class UpdateAttendanceMarkDto
{
    public int IdSession { get; set; }
    public string Status { get; set; } = string.Empty;
}