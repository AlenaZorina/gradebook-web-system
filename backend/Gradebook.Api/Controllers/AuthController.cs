using Gradebook.Api.Data;
using Gradebook.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly DbConnectionFactory _factory;

    public AuthController(DbConnectionFactory factory)
    {
        _factory = factory;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthLoginResponseDto>> Login([FromBody] AuthLoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Логин и пароль обязательны" });
        }

        await using var connection = _factory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT 
                u.id_user,
                ua.login,
                r.role_name,
                u.name,
                u.surname,
                u.fathername,
                ua.password_hash
            FROM user_auth ua
            JOIN "user" u ON ua.id_user = u.id_user
            JOIN role r ON u.id_role = r.id_role
            WHERE ua.login = @login
            LIMIT 1;
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("login", request.Login);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        var storedPassword = reader.GetString(6);

        if (storedPassword != request.Password)
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        var response = new AuthLoginResponseDto
        {
            IdUser = reader.GetInt32(0),
            Login = reader.GetString(1),
            Role = reader.GetString(2),
            Name = reader.GetString(3),
            Surname = reader.GetString(4),
            Fathername = reader.IsDBNull(5) ? null : reader.GetString(5)
        };

        return Ok(response);
    }
}