namespace Gradebook.Api.Dtos;

public class GroupDto
{
    public int IdGroup { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int CourseNo { get; set; }
    public int AdmissionYear { get; set; }
    public bool IsActive { get; set; }
}