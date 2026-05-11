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

        /*
         * office_students_view может возвращать одного и того же студента несколько раз,
         * если он связан с несколькими учебными сущностями в тестовых данных.
         * На первом экране "Студенты" нужна одна карточка на одного студента.
         */
        var response = rows
            .Where(row => row.IdStudent > 0)
            .GroupBy(GetStudentDuplicateKey)
            .Select(group =>
            {
                var row = ChoosePreferredStudentRow(group);

                var normalizedSurname = NormalizeSurnameByGender(
                    row.StudentSurname,
                    row.StudentName,
                    row.StudentFathername
                );

                return new OfficeStudentDto
                {
                    IdStudent = row.IdStudent,
                    IdUser = row.IdUser,
                    FullName = BuildFullName(
                        normalizedSurname,
                        row.StudentName,
                        row.StudentFathername
                    ),
                    Surname = normalizedSurname,
                    Name = row.StudentName,
                    Fathername = row.StudentFathername,
                    RecordBookNo = NormalizeRecordBookNo(
                        row.RecordBookNo,
                        row.IdStudent,
                        row.IdGroup,
                        row.CourseNo
                    ),
                    IdGroup = row.IdGroup,
                    GroupName = row.GroupName,
                    CourseNo = row.CourseNo,
                    IdProgram = row.IdProgram,
                    ProgramName = row.ProgramName,
                    IdStatus = row.IdStatus,
                    StudentStatus = row.StudentStatus
                };
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

        var normalizedSurname = NormalizeSurnameByGender(
            row.StudentSurname,
            row.StudentName,
            row.StudentFathername
        );

        var response = new OfficeStudentDetailsDto
        {
            IdStudent = row.IdStudent,
            IdUser = row.IdUser,
            FullName = BuildFullName(
                normalizedSurname,
                row.StudentName,
                row.StudentFathername
            ),
            Surname = normalizedSurname,
            Name = row.StudentName,
            Fathername = row.StudentFathername,
            RecordBookNo = NormalizeRecordBookNo(
                row.RecordBookNo,
                row.IdStudent,
                row.IdGroup,
                row.CourseNo
            ),
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

    private static string GetStudentDuplicateKey(SupabaseOfficeStudentRow row)
    {
        if (row.IdUser > 0)
        {
            return $"user:{row.IdUser}";
        }

        var normalizedFullName = NormalizeKeyPart(
            BuildFullName(row.StudentSurname, row.StudentName, row.StudentFathername)
        );

        if (!string.IsNullOrWhiteSpace(normalizedFullName))
        {
            return $"name:{normalizedFullName}";
        }

        return $"student:{row.IdStudent}";
    }

    private static SupabaseOfficeStudentRow ChoosePreferredStudentRow(
        IEnumerable<SupabaseOfficeStudentRow> rows
    )
    {
        return rows
            .OrderBy(row => IsInactiveStatus(row.StudentStatus) ? 1 : 0)
            .ThenByDescending(row => row.CourseNo)
            .ThenBy(row => row.GroupName)
            .First();
    }

    private static bool IsInactiveStatus(string? status)
    {
        var normalized = NormalizeKeyPart(status);

        return normalized.Contains("отчис")
            || normalized.Contains("переведен")
            || normalized.Contains("переведён")
            || normalized.Contains("архив")
            || normalized.Contains("inactive");
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private static string NormalizeSurnameByGender(
        string surname,
        string name,
        string? fathername
    )
    {
        var trimmedSurname = surname.Trim();
        var normalizedName = NormalizeKeyPart(name);
        var normalizedFathername = NormalizeKeyPart(fathername);

        var isClearlyMale =
            normalizedFathername.EndsWith("ич")
            || MaleNames.Contains(normalizedName);

        var isClearlyFemale =
            normalizedFathername.EndsWith("на")
            || FemaleNames.Contains(normalizedName);

        if (isClearlyMale)
        {
            if (trimmedSurname.EndsWith("ова", StringComparison.OrdinalIgnoreCase)
                || trimmedSurname.EndsWith("ева", StringComparison.OrdinalIgnoreCase)
                || trimmedSurname.EndsWith("ина", StringComparison.OrdinalIgnoreCase)
                || trimmedSurname.EndsWith("ына", StringComparison.OrdinalIgnoreCase))
            {
                return trimmedSurname[..^1];
            }

            if (trimmedSurname.EndsWith("ая", StringComparison.OrdinalIgnoreCase))
            {
                return trimmedSurname[..^2] + "ий";
            }

            if (trimmedSurname.EndsWith("яя", StringComparison.OrdinalIgnoreCase))
            {
                return trimmedSurname[..^2] + "ий";
            }
        }

        if (isClearlyFemale)
        {
            if (trimmedSurname.EndsWith("ов", StringComparison.OrdinalIgnoreCase)
                || trimmedSurname.EndsWith("ев", StringComparison.OrdinalIgnoreCase)
                || trimmedSurname.EndsWith("ин", StringComparison.OrdinalIgnoreCase)
                || trimmedSurname.EndsWith("ын", StringComparison.OrdinalIgnoreCase))
            {
                return trimmedSurname + "а";
            }
        }

        return trimmedSurname;
    }

    private static string NormalizeRecordBookNo(
        string? recordBookNo,
        int idStudent,
        int idGroup,
        int courseNo
    )
    {
        var rawValue = (recordBookNo ?? string.Empty).Trim();

        if (IsValidRecordBookNo(rawValue))
        {
            return rawValue;
        }

        /*
         * Для демонстрационной базы заменяем служебные номера AUTOHSE/AUTONSE
         * на стабильный числовой номер, чтобы на всех экранах он выглядел нормально.
         */
        return $"{courseNo}{idGroup:D3}{idStudent:D4}";
    }

    private static bool IsValidRecordBookNo(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim().ToUpperInvariant();

        if (normalized.Contains("AUTOHSE") || normalized.Contains("AUTONSE"))
        {
            return false;
        }

        return value.Any(char.IsDigit) && !value.Any(char.IsLetter);
    }

    private static string NormalizeKeyPart(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return string.Join(
            " ",
            value
                .Trim()
                .ToLowerInvariant()
                .Replace('ё', 'е')
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
        );
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

    private static readonly HashSet<string> MaleNames = new()
    {
        "александр",
        "алексей",
        "артем",
        "артемий",
        "владимир",
        "глеб",
        "даниил",
        "денис",
        "дмитрий",
        "егор",
        "иван",
        "илья",
        "кирилл",
        "максим",
        "михаил",
        "никита",
        "павел",
        "роман",
        "сергей",
        "федор",
        "юрий",
        "ярослав"
    };

    private static readonly HashSet<string> FemaleNames = new()
    {
        "алина",
        "анна",
        "арина",
        "вероника",
        "виктория",
        "дарья",
        "елизавета",
        "мария",
        "полина",
        "софья",
        "софия",
        "яна"
    };

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