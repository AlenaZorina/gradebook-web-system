namespace Gradebook.Api.Dtos;

public class AuthLoginResponseDto
{
    public int IdUser { get; set; }
    public string Login { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? Fathername { get; set; }
}