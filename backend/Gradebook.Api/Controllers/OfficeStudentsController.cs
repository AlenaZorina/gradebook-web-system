using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeStudentsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeStudentsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/students")]
    public async Task<ActionResult<List<OfficeStudentDto>>> GetStudents(int idUser)
    {
        var query =
            "office_students_view"
            + "?select=id_student,id_user,record_book_no,student_surname,student_name,student_fathername,id_group,group_name,course_no,id_program,program_name,id_status,student_status"
            + "&order=student_surname.asc,student_name.asc,student_fathername.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения списка студентов из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeStudentRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeStudentRow>();

        var response = rows
            .Select(row => new OfficeStudentDto
            {
                IdStudent = row.IdStudent,
                IdUser = row.IdUser,
                FullName = BuildFullName(
                    row.StudentSurname,
                    row.StudentName,
                    row.StudentFathername
                ),
                Surname = row.StudentSurname,
                Name = row.StudentName,
                Fathername = row.StudentFathername,
                RecordBookNo = row.RecordBookNo ?? string.Empty,
                IdGroup = row.IdGroup,
                GroupName = row.GroupName,
                CourseNo = row.CourseNo,
                IdProgram = row.IdProgram,
                ProgramName = row.ProgramName,
                IdStatus = row.IdStatus,
                StudentStatus = row.StudentStatus
            })
            .OrderBy(student => student.FullName)
            .ToList();

        return Ok(response);
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private class SupabaseOfficeStudentRow
    {
        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("id_user")]
        public int IdUser { get; set; }

        [JsonPropertyName("record_book_no")]
        public string? RecordBookNo { get; set; }

        [JsonPropertyName("student_surname")]
        public string StudentSurname { get; set; } = string.Empty;

        [JsonPropertyName("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student_fathername")]
        public string? StudentFathername { get; set; }

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("id_status")]
        public int? IdStatus { get; set; }

        [JsonPropertyName("student_status")]
        public string? StudentStatus { get; set; }
    }
}