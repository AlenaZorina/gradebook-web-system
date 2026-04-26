namespace Gradebook.Api.Dtos;

public class UpdateTeacherGradebookRequestDto
{
    public int IdSheet { get; set; }
    public List<UpdateGradebookStudentDto> Students { get; set; } = new();
}

public class UpdateGradebookStudentDto
{
    public int IdStudent { get; set; }
    public List<UpdateGradebookGradeDto> Grades { get; set; } = new();
    public int IdFinalGrade { get; set; }
    public decimal? FinalGrade { get; set; }
}

public class UpdateGradebookGradeDto
{
    public int IdGrade { get; set; }
    public int IdElement { get; set; }
    public decimal? GradeValue { get; set; }
}