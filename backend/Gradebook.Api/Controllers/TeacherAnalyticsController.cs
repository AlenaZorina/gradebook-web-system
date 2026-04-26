using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherAnalyticsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public TeacherAnalyticsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/teacher-analytics")]
    public async Task<ActionResult<TeacherAnalyticsDto>> GetTeacherAnalytics(
        int idUser,
        [FromQuery] int? disciplineId,
        [FromQuery] int? groupId)
    {
        var lessonQuery =
            "teacher_bi_lesson_attendance_mart_view" +
            "?select=teacher_user_id,id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,id_session,lesson_date,total_students,present_count,absent_count,attendance_percent" +
            $"&teacher_user_id=eq.{idUser}";

        var studentAttendanceQuery =
            "teacher_bi_student_attendance_mart_view" +
            "?select=teacher_user_id,id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,id_student,student_full_name,total_lessons,present_count,absent_count,attendance_percent" +
            $"&teacher_user_id=eq.{idUser}";

        var performanceQuery =
            "teacher_bi_student_performance_mart_view" +
            "?select=teacher_user_id,id_assignment,id_sheet,sheet_status,id_discipline,discipline_name,id_group,group_name,course_no,id_student,student_full_name,total_control_grades,filled_control_grades,missing_grades_count,average_control_grade,final_grade" +
            $"&teacher_user_id=eq.{idUser}";

        if (disciplineId.HasValue)
        {
            lessonQuery += $"&id_discipline=eq.{disciplineId.Value}";
            studentAttendanceQuery += $"&id_discipline=eq.{disciplineId.Value}";
            performanceQuery += $"&id_discipline=eq.{disciplineId.Value}";
        }

        if (groupId.HasValue)
        {
            lessonQuery += $"&id_group=eq.{groupId.Value}";
            studentAttendanceQuery += $"&id_group=eq.{groupId.Value}";
            performanceQuery += $"&id_group=eq.{groupId.Value}";
        }

        lessonQuery += "&order=lesson_date.asc";
        performanceQuery += "&order=discipline_name.asc,group_name.asc,student_full_name.asc";

        var lessonResult = await _supabase.GetAsync(lessonQuery);
        var studentAttendanceResult = await _supabase.GetAsync(studentAttendanceQuery);
        var performanceResult = await _supabase.GetAsync(performanceQuery);

        if (!lessonResult.Success)
        {
            return StatusCode(lessonResult.StatusCode, new
            {
                message = "Ошибка получения посещаемости для BI",
                details = lessonResult.Body
            });
        }

        if (!studentAttendanceResult.Success)
        {
            return StatusCode(studentAttendanceResult.StatusCode, new
            {
                message = "Ошибка получения посещаемости студентов для BI",
                details = studentAttendanceResult.Body
            });
        }

        if (!performanceResult.Success)
        {
            return StatusCode(performanceResult.StatusCode, new
            {
                message = "Ошибка получения ведомостей для BI",
                details = performanceResult.Body
            });
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var lessons = JsonSerializer.Deserialize<List<LessonAttendanceRecord>>(
            lessonResult.Body,
            options
        ) ?? new List<LessonAttendanceRecord>();

        var studentAttendance = JsonSerializer.Deserialize<List<StudentAttendanceRecord>>(
            studentAttendanceResult.Body,
            options
        ) ?? new List<StudentAttendanceRecord>();

        var performance = JsonSerializer.Deserialize<List<StudentPerformanceRecord>>(
            performanceResult.Body,
            options
        ) ?? new List<StudentPerformanceRecord>();

        var attendanceByDate = BuildAttendanceByDate(lessons);
        var gradeDistribution = BuildGradeDistribution(performance);
        var riskStudents = BuildRiskStudents(performance, studentAttendance);
        var comparison = BuildDisciplineComparison(lessons, performance, riskStudents);

        var totalAttendanceStudents = lessons.Sum(item => item.TotalStudents);
        var totalPresent = lessons.Sum(item => item.PresentCount);

        decimal? averageAttendance = totalAttendanceStudents == 0
            ? null
            : Math.Round(100m * totalPresent / totalAttendanceStudents, 1);

        var finalGrades = performance
            .Where(item => item.FinalGrade.HasValue)
            .Select(item => item.FinalGrade!.Value)
            .ToList();

        decimal? averageFinalGrade = finalGrades.Count == 0
            ? null
            : Math.Round(finalGrades.Average(), 1);

        var response = new TeacherAnalyticsDto
        {
            TeacherUserId = idUser,

            DisciplinesCount = performance
                .Select(item => item.IdDiscipline)
                .Union(lessons.Select(item => item.IdDiscipline))
                .Distinct()
                .Count(),

            GroupsCount = performance
                .Select(item => item.IdGroup)
                .Union(lessons.Select(item => item.IdGroup))
                .Distinct()
                .Count(),

            StudentsCount = performance
                .Select(item => item.IdStudent)
                .Union(studentAttendance.Select(item => item.IdStudent))
                .Distinct()
                .Count(),

            TotalLessons = lessons.Select(item => item.IdSession).Distinct().Count(),
            AverageAttendancePercent = averageAttendance,
            AverageFinalGrade = averageFinalGrade,

            AtRiskStudentsCount = riskStudents.Count,
            FilledFinalGradesCount = performance.Count(item => item.FinalGrade.HasValue),
            SubmittedSheetsCount = performance
                .Where(item => item.SheetStatus == "submitted")
                .Select(item => item.IdSheet)
                .Distinct()
                .Count(),

            DraftSheetsCount = performance
                .Where(item => item.SheetStatus == "draft")
                .Select(item => item.IdSheet)
                .Distinct()
                .Count(),

            AttendanceByDate = attendanceByDate,
            GradeDistribution = gradeDistribution,
            DisciplineComparison = comparison,
            RiskStudents = riskStudents.Take(8).ToList()
        };

        return Ok(response);
    }

    private static List<AnalyticsAttendancePointDto> BuildAttendanceByDate(
        List<LessonAttendanceRecord> lessons)
    {
        return lessons
            .GroupBy(item => item.LessonDate)
            .Select(group =>
            {
                var total = group.Sum(item => item.TotalStudents);
                var present = group.Sum(item => item.PresentCount);
                var absent = group.Sum(item => item.AbsentCount);

                var date = DateOnly.Parse(group.Key);

                return new AnalyticsAttendancePointDto
                {
                    LessonDate = group.Key,
                    DateLabel = date.ToString("d.MM", CultureInfo.GetCultureInfo("ru-RU")),
                    PresentCount = present,
                    AbsentCount = absent,
                    TotalStudents = total,
                    AttendancePercent = total == 0
                        ? null
                        : Math.Round(100m * present / total, 1)
                };
            })
            .OrderBy(item => DateOnly.Parse(item.LessonDate))
            .ToList();
    }

    private static List<AnalyticsGradeDistributionDto> BuildGradeDistribution(
        List<StudentPerformanceRecord> performance)
    {
        var buckets = new Dictionary<string, int>
        {
            ["0–3"] = 0,
            ["4–5"] = 0,
            ["6–7"] = 0,
            ["8–10"] = 0,
            ["нет итога"] = 0
        };

        foreach (var item in performance)
        {
            if (!item.FinalGrade.HasValue)
            {
                buckets["нет итога"]++;
            }
            else if (item.FinalGrade.Value < 4)
            {
                buckets["0–3"]++;
            }
            else if (item.FinalGrade.Value < 6)
            {
                buckets["4–5"]++;
            }
            else if (item.FinalGrade.Value < 8)
            {
                buckets["6–7"]++;
            }
            else
            {
                buckets["8–10"]++;
            }
        }

        return buckets
            .Select(item => new AnalyticsGradeDistributionDto
            {
                Label = item.Key,
                Count = item.Value
            })
            .ToList();
    }

    private static List<AnalyticsRiskStudentDto> BuildRiskStudents(
        List<StudentPerformanceRecord> performance,
        List<StudentAttendanceRecord> attendance)
    {
        var attendanceMap = attendance
            .GroupBy(item => $"{item.IdAssignment}:{item.IdStudent}")
            .ToDictionary(
                group => group.Key,
                group => group.First().AttendancePercent
            );

        var risks = new List<AnalyticsRiskStudentDto>();

        foreach (var student in performance)
        {
            var key = $"{student.IdAssignment}:{student.IdStudent}";
            attendanceMap.TryGetValue(key, out var attendancePercent);

            var reasons = new List<string>();

            if (attendancePercent.HasValue && attendancePercent.Value < 70)
            {
                reasons.Add("низкая посещаемость");
            }

            if (student.FinalGrade.HasValue && student.FinalGrade.Value < 4)
            {
                reasons.Add("низкий итоговый балл");
            }

            if (!student.FinalGrade.HasValue)
            {
                reasons.Add("не заполнен итог");
            }

            if (student.MissingGradesCount >= 2)
            {
                reasons.Add("много незаполненных работ");
            }

            if (reasons.Count == 0)
            {
                continue;
            }

            risks.Add(new AnalyticsRiskStudentDto
            {
                IdStudent = student.IdStudent,
                FullName = student.StudentFullName,
                IdDiscipline = student.IdDiscipline,
                DisciplineName = student.DisciplineName,
                IdGroup = student.IdGroup,
                GroupName = student.GroupName,
                AttendancePercent = attendancePercent,
                FinalGrade = student.FinalGrade,
                MissingGradesCount = student.MissingGradesCount,
                RiskReason = string.Join(", ", reasons)
            });
        }

        return risks
            .OrderByDescending(item => item.RiskReason.Contains("низкая посещаемость"))
            .ThenBy(item => item.FinalGrade ?? 99)
            .ThenBy(item => item.FullName)
            .ToList();
    }

    private static List<AnalyticsDisciplineComparisonDto> BuildDisciplineComparison(
        List<LessonAttendanceRecord> lessons,
        List<StudentPerformanceRecord> performance,
        List<AnalyticsRiskStudentDto> risks)
    {
        var lessonKeys = lessons.Select(item => new
        {
            item.IdDiscipline,
            item.DisciplineName,
            item.IdGroup,
            item.GroupName,
            item.CourseNo
        });

        var performanceKeys = performance.Select(item => new
        {
            item.IdDiscipline,
            item.DisciplineName,
            item.IdGroup,
            item.GroupName,
            item.CourseNo
        });

        var keys = lessonKeys
            .Union(performanceKeys)
            .Distinct()
            .OrderBy(item => item.DisciplineName)
            .ThenBy(item => item.GroupName)
            .ToList();

        return keys.Select(key =>
        {
            var groupLessons = lessons
                .Where(item =>
                    item.IdDiscipline == key.IdDiscipline &&
                    item.IdGroup == key.IdGroup)
                .ToList();

            var total = groupLessons.Sum(item => item.TotalStudents);
            var present = groupLessons.Sum(item => item.PresentCount);

            var groupPerformance = performance
                .Where(item =>
                    item.IdDiscipline == key.IdDiscipline &&
                    item.IdGroup == key.IdGroup)
                .ToList();

            var finalGrades = groupPerformance
                .Where(item => item.FinalGrade.HasValue)
                .Select(item => item.FinalGrade!.Value)
                .ToList();

            return new AnalyticsDisciplineComparisonDto
            {
                IdDiscipline = key.IdDiscipline,
                DisciplineName = key.DisciplineName,
                IdGroup = key.IdGroup,
                GroupName = key.GroupName,
                CourseNo = key.CourseNo,
                StudentsCount = groupPerformance.Select(item => item.IdStudent).Distinct().Count(),

                AverageAttendancePercent = total == 0
                    ? null
                    : Math.Round(100m * present / total, 1),

                AverageFinalGrade = finalGrades.Count == 0
                    ? null
                    : Math.Round(finalGrades.Average(), 1),

                AtRiskStudentsCount = risks.Count(item =>
                    item.IdDiscipline == key.IdDiscipline &&
                    item.IdGroup == key.IdGroup)
            };
        }).ToList();
    }

    private class LessonAttendanceRecord
    {
        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("id_session")]
        public int IdSession { get; set; }

        [JsonPropertyName("lesson_date")]
        public string LessonDate { get; set; } = string.Empty;

        [JsonPropertyName("total_students")]
        public int TotalStudents { get; set; }

        [JsonPropertyName("present_count")]
        public int PresentCount { get; set; }

        [JsonPropertyName("absent_count")]
        public int AbsentCount { get; set; }

        [JsonPropertyName("attendance_percent")]
        public decimal? AttendancePercent { get; set; }
    }

    private class StudentAttendanceRecord
    {
        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_full_name")]
        public string StudentFullName { get; set; } = string.Empty;

        [JsonPropertyName("attendance_percent")]
        public decimal? AttendancePercent { get; set; }
    }

    private class StudentPerformanceRecord
    {
        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("id_sheet")]
        public int IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string SheetStatus { get; set; } = string.Empty;

        [JsonPropertyName("id_discipline")]
        public int IdDiscipline { get; set; }

        [JsonPropertyName("discipline_name")]
        public string DisciplineName { get; set; } = string.Empty;

        [JsonPropertyName("id_group")]
        public int IdGroup { get; set; }

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("course_no")]
        public int CourseNo { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_full_name")]
        public string StudentFullName { get; set; } = string.Empty;

        [JsonPropertyName("missing_grades_count")]
        public int MissingGradesCount { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }
}