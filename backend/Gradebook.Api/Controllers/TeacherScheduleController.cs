/*using Gradebook.Api.Data;
using Gradebook.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherScheduleController : ControllerBase
{
    private readonly DbConnectionFactory _factory;

    public TeacherScheduleController(DbConnectionFactory factory)
    {
        _factory = factory;
    }

    [HttpGet("{idUser:int}/teacher-schedule")]
    public async Task<ActionResult<List<TeacherScheduleItemDto>>> GetTeacherSchedule(int idUser)
    {
        var result = new List<TeacherScheduleItemDto>();

        var today = DateTime.Today;
        var diff = ((7 + (int)today.DayOfWeek - (int)DayOfWeek.Monday) % 7);
        var monday = today.AddDays(-diff).Date;
        var saturdayNextWeek = monday.AddDays(12).Date;

        await using var connection = _factory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT
                se.id_entry,
                se.lesson_date::text,
                EXTRACT(ISODOW FROM se.lesson_date)::int AS day_of_week,
                to_char(se.start_time, 'HH24:MI') AS start_time,
                to_char(se.end_time, 'HH24:MI') AS end_time,
                se.week_no,
                se.module_no,
                d.discipline_name,
                g.group_name,
                p.program_name
            FROM teachers t
            JOIN teaching_assignments ta ON ta.id_teacher = t.id_teacher
            JOIN schedule_entries se ON se.id_assignment = ta.id_assignment
            JOIN groups g ON ta.id_group = g.id_group
            JOIN programs p ON g.id_program = p.id_program
            JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
            JOIN disciplines d ON e.id_discipline = d.id_discipline
            WHERE t.id_user = @idUser
              AND se.lesson_date BETWEEN @dateFrom AND @dateTo
            ORDER BY se.lesson_date, se.start_time, d.discipline_name;
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("idUser", idUser);
        command.Parameters.AddWithValue("dateFrom", monday);
        command.Parameters.AddWithValue("dateTo", saturdayNextWeek);

        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            result.Add(new TeacherScheduleItemDto
            {
                IdEntry = reader.GetInt32(0),
                LessonDate = reader.GetString(1),
                DayOfWeek = reader.GetInt32(2),
                StartTime = reader.GetString(3),
                EndTime = reader.GetString(4),
                WeekNo = reader.GetInt32(5),
                ModuleNo = reader.GetInt32(6),
                DisciplineName = reader.GetString(7),
                GroupName = reader.GetString(8),
                ProgramName = reader.GetString(9)
            });
        }

        return Ok(result);
    }
}*/