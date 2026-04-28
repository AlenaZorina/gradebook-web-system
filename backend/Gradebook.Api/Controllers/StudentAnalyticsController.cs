using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class StudentAnalyticsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public StudentAnalyticsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/student-analytics")]
    public async Task<ActionResult<StudentAnalyticsDto>> GetStudentAnalytics(
        int idUser,
        [FromQuery] int? disciplineId
    )
    {
        var attendanceQuery =
            "student_bi_attendance_mart_view"
            + "?select=student_user_id,id_student,student_full_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,id_discipline,discipline_name,id_session,lesson_date,attendance_status,attendance_value"
            + $"&student_user_id=eq.{idUser}";

        var gradesQuery =
            "student_bi_grade_mart_view"
            + "?select=student_user_id,id_student,student_full_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,id_discipline,discipline_name,id_sheet,sheet_status,id_element,element_name,control_type,weight,element_order_no,grade_value,final_grade"
            + $"&student_user_id=eq.{idUser}";

        if (disciplineId.HasValue)
        {
            attendanceQuery += $"&id_discipline=eq.{disciplineId.Value}";
            gradesQuery += $"&id_discipline=eq.{disciplineId.Value}";
        }

        attendanceQuery += "&order=lesson_date.asc";
        gradesQuery += "&order=discipline_name.asc,element_order_no.asc";

        var attendanceResult = await _supabase.GetAsync(attendanceQuery);
        var gradesResult = await _supabase.GetAsync(gradesQuery);

        if (!attendanceResult.Success)
        {
            return StatusCode(
                attendanceResult.StatusCode,
                new
                {
                    message = "Ошибка получения посещаемости для BI студента",
                    details = attendanceResult.Body
                }
            );
        }

        if (!gradesResult.Success)
        {
            return StatusCode(
                gradesResult.StatusCode,
                new
                {
                    message = "Ошибка получения оценок для BI студента",
                    details = gradesResult.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var attendance = JsonSerializer.Deserialize<List<StudentAnalyticsAttendanceRecord>>(
            attendanceResult.Body,
            options
        ) ?? new List<StudentAnalyticsAttendanceRecord>();

        var grades = JsonSerializer.Deserialize<List<StudentAnalyticsGradeRecord>>(
            gradesResult.Body,
            options
        ) ?? new List<StudentAnalyticsGradeRecord>();

        if (attendance.Count == 0 && grades.Count == 0)
        {
            return NotFound(new { message = "Данные для аналитики студента не найдены" });
        }

        var firstAttendance = attendance.FirstOrDefault();
        var firstGrade = grades.FirstOrDefault();

        var idStudent = firstAttendance?.IdStudent ?? firstGrade?.IdStudent ?? 0;
        var studentFullName = firstAttendance?.StudentFullName
            ?? firstGrade?.StudentFullName
            ?? string.Empty;
        var groupName = firstAttendance?.GroupName ?? firstGrade?.GroupName ?? string.Empty;
        var courseNo = firstAttendance?.CourseNo ?? firstGrade?.CourseNo ?? 0;
        var programName = firstAttendance?.ProgramName
            ?? firstGrade?.ProgramName
            ?? string.Empty;

        var countedAttendance = attendance
            .Where(item => item.AttendanceValue.HasValue)
            .ToList();

        decimal? averageAttendance = countedAttendance.Count == 0
            ? null
            : Math.Round(100m * countedAttendance.Sum(item => item.AttendanceValue!.Value) / countedAttendance.Count, 1);

        var filledGrades = grades
            .Where(item => item.IdElement.HasValue && item.GradeValue.HasValue)
            .ToList();

        var gradeRows = grades
            .Where(item => item.IdElement.HasValue)
            .ToList();

        decimal? averageGrade = filledGrades.Count == 0
            ? null
            : Math.Round(filledGrades.Average(item => item.GradeValue!.Value), 1);

        var finalGrades = grades
            .Where(item => item.FinalGrade.HasValue)
            .GroupBy(item => item.IdDiscipline)
            .Select(group => group.First().FinalGrade!.Value)
            .ToList();

        decimal? preliminaryFinalGrade = finalGrades.Count > 0
            ? Math.Round(finalGrades.Average(), 1)
            : averageGrade;

        var attendanceByDate = BuildAttendanceByDate(attendance);
        var gradeProgress = BuildGradeProgress(grades);
        var gradeDistribution = BuildGradeDistribution(filledGrades);
        var disciplineSummary = BuildDisciplineSummary(attendance, grades);

        var missingGradesCount = gradeRows.Count(item => !item.GradeValue.HasValue);

        var risk = BuildGeneralRisk(
            averageAttendance,
            preliminaryFinalGrade,
            missingGradesCount
        );

        var disciplinesCount = attendance
            .Select(item => item.IdDiscipline)
            .Union(grades.Select(item => item.IdDiscipline))
            .Distinct()
            .Count();

        var response = new StudentAnalyticsDto
        {
            StudentUserId = idUser,
            IdStudent = idStudent,
            StudentFullName = studentFullName,
            GroupName = groupName,
            CourseNo = courseNo,
            ProgramName = programName,
            DisciplinesCount = disciplinesCount,
            TotalLessons = attendance.Select(item => item.IdSession).Distinct().Count(),
            AverageAttendancePercent = averageAttendance,
            AverageGrade = averageGrade,
            PreliminaryFinalGrade = preliminaryFinalGrade,
            FilledGradesCount = filledGrades.Count,
            TotalGradesCount = gradeRows.Count,
            MissingGradesCount = missingGradesCount,
            HasRisk = risk.HasRisk,
            RiskReason = risk.RiskReason,
            AttendanceByDate = attendanceByDate,
            GradeProgress = gradeProgress,
            GradeDistribution = gradeDistribution,
            DisciplineSummary = disciplineSummary
        };

        return Ok(response);
    }

    private static List<StudentAnalyticsAttendancePointDto> BuildAttendanceByDate(
        List<StudentAnalyticsAttendanceRecord> attendance
    )
    {
        return attendance
            .Where(item => item.AttendanceValue.HasValue)
            .GroupBy(item => item.LessonDate)
            .Select(group =>
            {
                var date = DateOnly.Parse(group.Key);
                var total = group.Count();
                var present = group.Sum(item => item.AttendanceValue!.Value);

                return new StudentAnalyticsAttendancePointDto
                {
                    LessonDate = group.Key,
                    DateLabel = date.ToString("dd.MM", CultureInfo.GetCultureInfo("ru-RU")),
                    AttendancePercent = total == 0
                        ? null
                        : Math.Round(100m * present / total, 1)
                };
            })
            .OrderBy(item => DateOnly.Parse(item.LessonDate))
            .ToList();
    }

    private static List<StudentAnalyticsGradePointDto> BuildGradeProgress(
        List<StudentAnalyticsGradeRecord> grades
    )
    {
        return grades
            .Where(item => item.IdElement.HasValue && item.GradeValue.HasValue)
            .OrderBy(item => item.DisciplineName)
            .ThenBy(item => item.ElementOrderNo ?? 0)
            .Select(item => new StudentAnalyticsGradePointDto
            {
                IdDiscipline = item.IdDiscipline,
                DisciplineName = item.DisciplineName,
                ElementName = item.ElementName ?? string.Empty,
                GradeValue = item.GradeValue,
                OrderNo = item.ElementOrderNo ?? 0
            })
            .ToList();
    }

    private static List<StudentAnalyticsGradeDistributionDto> BuildGradeDistribution(
        List<StudentAnalyticsGradeRecord> filledGrades
    )
    {
        return new List<StudentAnalyticsGradeDistributionDto>
        {
            new()
            {
                Label = "0–3",
                Count = filledGrades.Count(item => item.GradeValue < 4)
            },
            new()
            {
                Label = "4–5",
                Count = filledGrades.Count(item => item.GradeValue >= 4 && item.GradeValue < 6)
            },
            new()
            {
                Label = "6–7",
                Count = filledGrades.Count(item => item.GradeValue >= 6 && item.GradeValue < 8)
            },
            new()
            {
                Label = "8–10",
                Count = filledGrades.Count(item => item.GradeValue >= 8)
            }
        };
    }

    private static List<StudentAnalyticsDisciplineSummaryDto> BuildDisciplineSummary(
        List<StudentAnalyticsAttendanceRecord> attendance,
        List<StudentAnalyticsGradeRecord> grades
    )
    {
        var disciplineIds = attendance
            .Select(item => item.IdDiscipline)
            .Union(grades.Select(item => item.IdDiscipline))
            .Distinct()
            .ToList();

        return disciplineIds
            .Select(idDiscipline =>
            {
                var disciplineAttendance = attendance
                    .Where(item => item.IdDiscipline == idDiscipline && item.AttendanceValue.HasValue)
                    .ToList();

                var disciplineGrades = grades
                    .Where(item => item.IdDiscipline == idDiscipline && item.IdElement.HasValue)
                    .ToList();

                var filledDisciplineGrades = disciplineGrades
                    .Where(item => item.GradeValue.HasValue)
                    .ToList();

                decimal? attendancePercent = disciplineAttendance.Count == 0
                    ? null
                    : Math.Round(
                        100m * disciplineAttendance.Sum(item => item.AttendanceValue!.Value) / disciplineAttendance.Count,
                        1
                    );

                decimal? averageGrade = filledDisciplineGrades.Count == 0
                    ? null
                    : Math.Round(filledDisciplineGrades.Average(item => item.GradeValue!.Value), 1);

                decimal? finalGrade = grades
                    .Where(item => item.IdDiscipline == idDiscipline && item.FinalGrade.HasValue)
                    .Select(item => item.FinalGrade)
                    .FirstOrDefault();

                var missingGrades = disciplineGrades.Count(item => !item.GradeValue.HasValue);

                var risk = BuildGeneralRisk(attendancePercent, finalGrade ?? averageGrade, missingGrades);

                var sample = attendance.FirstOrDefault(item => item.IdDiscipline == idDiscipline)
                    ?? grades.FirstOrDefault(item => item.IdDiscipline == idDiscipline) as object;

                var disciplineName = attendance
                    .FirstOrDefault(item => item.IdDiscipline == idDiscipline)
                    ?.DisciplineName
                    ?? grades.FirstOrDefault(item => item.IdDiscipline == idDiscipline)
                    ?.DisciplineName
                    ?? "Дисциплина";

                return new StudentAnalyticsDisciplineSummaryDto
                {
                    IdDiscipline = idDiscipline,
                    DisciplineName = disciplineName,
                    AttendancePercent = attendancePercent,
                    AverageGrade = averageGrade,
                    FinalGrade = finalGrade ?? averageGrade,
                    MissingGradesCount = missingGrades,
                    HasRisk = risk.HasRisk,
                    RiskReason = risk.RiskReason
                };
            })
            .OrderBy(item => item.DisciplineName)
            .ToList();
    }

    private static (bool HasRisk, string RiskReason) BuildGeneralRisk(
        decimal? attendancePercent,
        decimal? grade,
        int missingGradesCount
    )
    {
        if (attendancePercent.HasValue && attendancePercent.Value < 70)
        {
            return (true, "Посещаемость ниже 70%");
        }

        if (grade.HasValue && grade.Value < 4)
        {
            return (true, "Есть риск неудовлетворительного результата");
        }

        if (missingGradesCount > 0)
        {
            return (true, "Есть незаполненные оценки");
        }

        return (false, "Критичных отклонений не найдено");
    }

    private class StudentAnalyticsAttendanceRecord
    {
        [JsonPropertyName("student_user_id")]
        public int StudentUserId { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_full_name")]
        public string StudentFullName { get; set; } = string.Empty;

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("id_session")]
        public int IdSession { get; set; }

        [JsonPropertyName("lesson_date")]
        public string LessonDate { get; set; } = string.Empty;

        [JsonPropertyName("attendance_status")]
        public string AttendanceStatus { get; set; } = string.Empty;

        [JsonPropertyName("attendance_value")]
        public int? AttendanceValue { get; set; }
    }

    private class StudentAnalyticsGradeRecord
    {
        [JsonPropertyName("student_user_id")]
        public int StudentUserId { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_full_name")]
        public string StudentFullName { get; set; } = string.Empty;

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("id_element")]
        public int? IdElement { get; set; }

        [JsonPropertyName("element_name")]
        public string? ElementName { get; set; }

        [JsonPropertyName("control_type")]
        public string? ControlType { get; set; }

        [JsonPropertyName("weight")]
        public decimal? Weight { get; set; }

        [JsonPropertyName("element_order_no")]
        public int? ElementOrderNo { get; set; }

        [JsonPropertyName("grade_value")]
        public decimal? GradeValue { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }
}