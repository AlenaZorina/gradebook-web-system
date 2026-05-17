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
    private const int BcryptWorkFactor = 12;

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

        var query = "user_auth"
            + "?select=id_user,login,password_hash,users(id_user,name,surname,fathername,role(role_name),teachers(id_teacher,department,position))"
            + $"&login=eq.{login}"
            + "&limit=1";

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

        var isPasswordValid = VerifyPassword(request.Password, record.PasswordHash);

        if (!isPasswordValid)
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        // Временная совместимость:
        // если в БД еще лежал старый открытый пароль, то после успешного входа
        // сразу заменяем его на BCrypt-хэш.
        if (!IsBcryptHash(record.PasswordHash))
        {
            await UpgradePlainPasswordToHash(record.IdUser, request.Password);
        }

        if (record.User == null || record.User.Role == null)
        {
            return StatusCode(500, new { message = "У пользователя не найдены данные профиля или роли" });
        }

        var teacherProfile = record.User.Teacher;

        var response = new AuthLoginResponseDto
        {
            IdUser = record.User.IdUser,
            Login = record.Login,
            Role = record.User.Role.RoleName,
            Name = record.User.Name,
            Surname = record.User.Surname,
            Fathername = record.User.Fathername,
            Department = teacherProfile?.Department,
            Position = teacherProfile?.Position
        };

        return Ok(response);
    }

    private static bool VerifyPassword(string inputPassword, string storedPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(storedPasswordHash))
        {
            return false;
        }

        if (IsBcryptHash(storedPasswordHash))
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(inputPassword, storedPasswordHash);
            }
            catch
            {
                return false;
            }
        }

        // Временный режим для старых данных:
        // пока вы не захэшировали все пароли в Supabase, старые пользователи смогут войти.
        // После входа их пароль автоматически заменится на BCrypt-хэш.
        return storedPasswordHash == inputPassword;
    }

    private static bool IsBcryptHash(string value)
    {
        return value.StartsWith("$2a$")
            || value.StartsWith("$2b$")
            || value.StartsWith("$2y$");
    }

    private async Task UpgradePlainPasswordToHash(int idUser, string plainPassword)
    {
        var newHash = BCrypt.Net.BCrypt.HashPassword(plainPassword, BcryptWorkFactor);

        var updateResult = await _supabase.PatchAsync(
            $"user_auth?id_user=eq.{idUser}",
            new
            {
                password_hash = newHash
            }
        );

        // Вход пользователя не блокируем, если автообновление хэша не удалось.
        // Но в консоль backend будет полезно вывести сообщение для отладки.
        if (!updateResult.Success)
        {
            Console.WriteLine(
                $"Не удалось обновить пароль пользователя id_user={idUser}. " +
                $"Status={updateResult.StatusCode}. Body={updateResult.Body}"
            );
        }
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

        [JsonPropertyName("teachers")]
        public SupabaseTeacher? Teacher { get; set; }
    }

    private class SupabaseRole
    {
        [JsonPropertyName("role_name")]
        public string RoleName { get; set; } = string.Empty;
    }

    private class SupabaseTeacher
    {
        [JsonPropertyName("id_teacher")]
        public int IdTeacher { get; set; }

        [JsonPropertyName("department")]
        public string? Department { get; set; }

        [JsonPropertyName("position")]
        public string? Position { get; set; }
    }
}