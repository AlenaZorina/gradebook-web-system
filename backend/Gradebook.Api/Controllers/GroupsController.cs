using Gradebook.Api.Data;
using Gradebook.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly DbConnectionFactory _factory;

    public GroupsController(DbConnectionFactory factory)
    {
        _factory = factory;
    }

    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetGroups()
    {
        var result = new List<GroupDto>();

        await using var connection = _factory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id_group, group_name, course_no, admission_year, is_active
            FROM groups
            ORDER BY group_name;
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            result.Add(new GroupDto
            {
                IdGroup = reader.GetInt32(0),
                GroupName = reader.GetString(1),
                CourseNo = reader.GetInt32(2),
                AdmissionYear = reader.GetInt32(3),
                IsActive = reader.GetBoolean(4)
            });
        }

        return Ok(result);
    }
}