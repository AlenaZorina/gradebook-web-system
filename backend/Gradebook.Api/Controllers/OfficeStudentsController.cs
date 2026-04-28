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

        var rows = Deserialize<List<SupabaseOfficeStudentRow>>(result.Body) ?? new();

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

    [HttpGet("{idUser:int}/office/students/{studentId:int}")]
    public async Task<ActionResult<OfficeStudentDetailsDto>> GetStudentDetails(
        int idUser,
        int studentId
    )
    {
        var query =
            "office_student_details_view"
            + "?select=id_student,id_user,record_book_no,student_surname,student_name,student_fathername,email,id_group,group_name,course_no,id_program,program_name,id_status,student_status"
            + $"&id_student=eq.{studentId}"
            + "&limit=1";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения карточки студента из Supabase",
                    details = result.Body
                }
            );
        }

        var rows = Deserialize<List<SupabaseOfficeStudentDetailsRow>>(result.Body) ?? new();
        var row = rows.FirstOrDefault();

        if (row is null)
        {
            return NotFound(new { message = "Студент не найден" });
        }

        var response = new OfficeStudentDetailsDto
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
            Email = row.Email,
            IdGroup = row.IdGroup,
            GroupName = row.GroupName,
            CourseNo = row.CourseNo,
            IdProgram = row.IdProgram,
            ProgramName = row.ProgramName,
            IdStatus = row.IdStatus,
            StudentStatus = row.StudentStatus
        };

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/students/{studentId:int}/attendance-summary")]
    public async Task<ActionResult<List<OfficeStudentAttendanceDisciplineDto>>> GetStudentAttendanceSummary(
        int idUser,
        int studentId
    )
    {
        var query =
            "office_student_attendance_summary_view"
            + "?select=id_student,id_discipline,discipline_name,pud_url,id_enrollment,course_no,start_module_no,end_module_no,id_assignment,academic_year,sessions_count,marked_attendance_count,present_attendance_count,absent_attendance_count"
            + $"&id_student=eq.{studentId}"
            + "&order=discipline_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения посещаемости студента из Supabase",
                    details = result.Body
                }
            );
        }

        var rows = Deserialize<List<SupabaseOfficeStudentAttendanceRow>>(result.Body) ?? new();

        var response = rows
            .Select(row =>
            {
                decimal? attendancePercent = row.SessionsCount == 0
                    ? null
                    : Math.Round(
                        (decimal)row.PresentAttendanceCount / row.SessionsCount * 100m,
                        1
                    );

                return new OfficeStudentAttendanceDisciplineDto
                {
                    IdStudent = row.IdStudent,
                    IdDiscipline = row.IdDiscipline,
                    DisciplineName = row.DisciplineName,
                    PudUrl = row.PudUrl,
                    IdEnrollment = row.IdEnrollment,
                    CourseNo = row.CourseNo,
                    ModuleNos = ExpandModules(row.StartModuleNo, row.EndModuleNo).ToList(),
                    IdAssignment = row.IdAssignment,
                    AcademicYear = row.AcademicYear,
                    SessionsCount = row.SessionsCount,
                    MarkedAttendanceCount = row.MarkedAttendanceCount,
                    PresentAttendanceCount = row.PresentAttendanceCount,
                    AbsenceCount = row.AbsentAttendanceCount,
                    AttendancePercent = attendancePercent
                };
            })
            .OrderBy(item => item.DisciplineName)
            .ToList();

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/students/{studentId:int}/gradebook-summary")]
    public async Task<ActionResult<List<OfficeStudentGradebookDisciplineDto>>> GetStudentGradebookSummary(
        int idUser,
        int studentId
    )
    {
        var query =
            "office_student_gradebook_summary_view"
            + "?select=id_student,id_discipline,discipline_name,pud_url,id_enrollment,course_no,start_module_no,end_module_no,id_assignment,academic_year,id_sheet,sheet_status,final_grade"
            + $"&id_student=eq.{studentId}"
            + "&order=discipline_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения ведомости студента из Supabase",
                    details = result.Body
                }
            );
        }

        var rows = Deserialize<List<SupabaseOfficeStudentGradebookRow>>(result.Body) ?? new();

        var response = rows
            .Select(row => new OfficeStudentGradebookDisciplineDto
            {
                IdStudent = row.IdStudent,
                IdDiscipline = row.IdDiscipline,
                DisciplineName = row.DisciplineName,
                PudUrl = row.PudUrl,
                IdEnrollment = row.IdEnrollment,
                CourseNo = row.CourseNo,
                ModuleNos = ExpandModules(row.StartModuleNo, row.EndModuleNo).ToList(),
                IdAssignment = row.IdAssignment,
                AcademicYear = row.AcademicYear,
                IdSheet = row.IdSheet,
                SheetStatus = row.SheetStatus ?? string.Empty,
                FinalGrade = row.FinalGrade
            })
            .OrderBy(item => item.DisciplineName)
            .ToList();

        return Ok(response);
    }

    private static T? Deserialize<T>(string body)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<T>(body, options);
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private static IEnumerable<int> ExpandModules(int? startModuleNo, int? endModuleNo)
    {
        if (!startModuleNo.HasValue && !endModuleNo.HasValue)
        {
            return Enumerable.Empty<int>();
        }

        var start = startModuleNo ?? endModuleNo!.Value;
        var end = endModuleNo ?? startModuleNo!.Value;

        if (end < start)
        {
            return new[] { start };
        }

        return Enumerable.Range(start, end - start + 1);
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

    private class SupabaseOfficeStudentDetailsRow : SupabaseOfficeStudentRow
    {
        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }

    private class SupabaseOfficeStudentAttendanceRow
    {
        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("pud_url")]
        public string? PudUrl { get; set; }

        [JsonPropertyName("id_enrollment")]
        public int IdEnrollment { get; set; }

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("sessions_count")]
        public int SessionsCount { get; set; }

        [JsonPropertyName("marked_attendance_count")]
        public int MarkedAttendanceCount { get; set; }

        [JsonPropertyName("present_attendance_count")]
        public int PresentAttendanceCount { get; set; }

        [JsonPropertyName("absent_attendance_count")]
        public int AbsentAttendanceCount { get; set; }
    }

    private class SupabaseOfficeStudentGradebookRow
    {
        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("pud_url")]
        public string? PudUrl { get; set; }

        [JsonPropertyName("id_enrollment")]
        public int IdEnrollment { get; set; }

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }
}