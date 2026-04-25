namespace Gradebook.Api.Dtos;

public class AuthLoginRequestDto
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}