using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public AuthController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthLoginResponseDto>> Login([FromBody] AuthLoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Логин и пароль обязательны" });
        }

        var login = Uri.EscapeDataString(request.Login.Trim());

        var query =
            "user_auth" +
            "?select=id_user,login,password_hash,users(id_user,name,surname,fathername,role(role_name))" +
            $"&login=eq.{login}" +
            "&limit=1";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new
            {
                message = "Ошибка обращения к Supabase",
                details = result.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseAuthRecord>>(result.Body, options)
                      ?? new List<SupabaseAuthRecord>();

        var record = records.FirstOrDefault();

        if (record == null)
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        // Для MVP пока сравниваем тестовый пароль напрямую.
        // Позже можно заменить на нормальное хеширование.
        if (record.PasswordHash != request.Password)
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        if (record.User == null || record.User.Role == null)
        {
            return StatusCode(500, new { message = "У пользователя не найдены данные профиля или роли" });
        }

        var response = new AuthLoginResponseDto
        {
            IdUser = record.User.IdUser,
            Login = record.Login,
            Role = record.User.Role.RoleName,
            Name = record.User.Name,
            Surname = record.User.Surname,
            Fathername = record.User.Fathername
        };

        return Ok(response);
    }

    private class SupabaseAuthRecord
    {
        [JsonPropertyName("id_user")]
        public int IdUser { get; set; }

        [JsonPropertyName("login")]
        public string Login { get; set; } = string.Empty;

        [JsonPropertyName("password_hash")]
        public string PasswordHash { get; set; } = string.Empty;

        [JsonPropertyName("users")]
        public SupabaseUser? User { get; set; }
    }

    private class SupabaseUser
    {
        [JsonPropertyName("id_user")]
        public int IdUser { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("surname")]
        public string Surname { get; set; } = string.Empty;

        [JsonPropertyName("fathername")]
        public string? Fathername { get; set; }

        [JsonPropertyName("role")]
        public SupabaseRole? Role { get; set; }
    }

    private class SupabaseRole
    {
        [JsonPropertyName("role_name")]
        public string RoleName { get; set; } = string.Empty;
    }
}