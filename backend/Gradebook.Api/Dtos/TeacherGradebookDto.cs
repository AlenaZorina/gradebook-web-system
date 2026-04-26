namespace Gradebook.Api.Dtos;

public class TeacherGradebookDto
{
    public int TeacherUserId { get; set; }

    public int IdSheet { get; set; }
    public string SheetStatus { get; set; } = string.Empty;

    public int IdDiscipline { get; set; }
    public string DisciplineName { get; set; } = string.Empty;

    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public int CourseNo { get; set; }

    public List<GradebookElementDto> Elements { get; set; } = new();
    public List<GradebookStudentDto> Students { get; set; } = new();
}

public class GradebookElementDto
{
    public int IdElement { get; set; }
    public string ElementName { get; set; } = string.Empty;
    public int OrderNo { get; set; }
}

public class GradebookStudentDto
{
    public int IdStudent { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string RecordBookNo { get; set; } = string.Empty;
    public List<GradebookGradeDto> Grades { get; set; } = new();
    public int IdFinalGrade { get; set; }
    public decimal? FinalGrade { get; set; }
}

public class GradebookGradeDto
{
    public int IdGrade { get; set; }
    public int IdElement { get; set; }
    public decimal? GradeValue { get; set; }
}