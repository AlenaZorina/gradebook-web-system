using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeAnalyticsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeAnalyticsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office-analytics")]
    public async Task<ActionResult<OfficeAnalyticsDto>> GetOfficeAnalytics(
        int idUser,
        [FromQuery] int? programId,
        [FromQuery] int? courseNo,
        [FromQuery] int? moduleNo
    )
    {
        var lessonsQuery =
            "office_bi_lesson_attendance_mart_view"
            + "?select=id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_session,lesson_date,total_students,present_count,absent_count,attendance_percent"
            + "&order=lesson_date.asc";

        var studentAttendanceQuery =
            "office_bi_student_attendance_mart_view"
            + "?select=id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_student,student_full_name,total_lessons,present_count,absent_count,attendance_percent"
            + "&order=discipline_name.asc,group_name.asc,student_full_name.asc";

        var performanceQuery =
            "office_bi_student_performance_mart_view"
            + "?select=id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_sheet,sheet_status,id_student,student_full_name,total_control_grades,filled_control_grades,missing_grades_count,average_control_grade,final_grade"
            + "&order=discipline_name.asc,group_name.asc,student_full_name.asc";

        var studentsQuery =
            "office_students_view"
            + "?select=id_student,id_user,student_surname,student_name,student_fathername,id_group,group_name,course_no,id_program,program_name,id_status,student_status"
            + "&order=student_surname.asc,student_name.asc";

        var lessonResult = await _supabase.GetAsync(lessonsQuery);
        var studentAttendanceResult = await _supabase.GetAsync(studentAttendanceQuery);
        var performanceResult = await _supabase.GetAsync(performanceQuery);
        var studentsResult = await _supabase.GetAsync(studentsQuery);

        if (!lessonResult.Success)
        {
            return StatusCode(
                lessonResult.StatusCode,
                new
                {
                    message = "Ошибка получения посещаемости для BI-модуля УО",
                    details = lessonResult.Body
                }
            );
        }

        if (!studentAttendanceResult.Success)
        {
            return StatusCode(
                studentAttendanceResult.StatusCode,
                new
                {
                    message = "Ошибка получения посещаемости студентов для BI-модуля УО",
                    details = studentAttendanceResult.Body
                }
            );
        }

        if (!performanceResult.Success)
        {
            return StatusCode(
                performanceResult.StatusCode,
                new
                {
                    message = "Ошибка получения ведомостей для BI-модуля УО",
                    details = performanceResult.Body
                }
            );
        }

        if (!studentsResult.Success)
        {
            return StatusCode(
                studentsResult.StatusCode,
                new
                {
                    message = "Ошибка получения студентов для BI-модуля УО",
                    details = studentsResult.Body
                }
            );
        }

        var lessons = Deserialize<List<LessonAttendanceRecord>>(lessonResult.Body) ?? new();
        var studentAttendance = Deserialize<List<StudentAttendanceRecord>>(studentAttendanceResult.Body) ?? new();
        var performance = Deserialize<List<StudentPerformanceRecord>>(performanceResult.Body) ?? new();
        var students = Deserialize<List<StudentStatusRecord>>(studentsResult.Body) ?? new();

        var filterOptions = BuildFilterOptions(students, lessons, performance);

        var filteredLessons = lessons
            .Where(item => MatchesScope(
                item.IdProgram,
                item.CourseNo,
                item.StartModuleNo,
                item.EndModuleNo,
                programId,
                courseNo,
                moduleNo
            ))
            .ToList();

        var filteredAttendance = studentAttendance
            .Where(item => MatchesScope(
                item.IdProgram,
                item.CourseNo,
                item.StartModuleNo,
                item.EndModuleNo,
                programId,
                courseNo,
                moduleNo
            ))
            .ToList();

        var filteredPerformance = performance
            .Where(item => MatchesScope(
                item.IdProgram,
                item.CourseNo,
                item.StartModuleNo,
                item.EndModuleNo,
                programId,
                courseNo,
                moduleNo
            ))
            .ToList();

        var filteredStudents = students
            .Where(item =>
                (!programId.HasValue || item.IdProgram == programId.Value)
                && (!courseNo.HasValue || item.CourseNo == courseNo.Value)
            )
            .ToList();

        if (moduleNo.HasValue)
        {
            var moduleStudentIds = filteredAttendance
                .Select(item => item.IdStudent)
                .Union(filteredPerformance.Select(item => item.IdStudent))
                .Distinct()
                .ToHashSet();

            filteredStudents = filteredStudents
                .Where(item => moduleStudentIds.Contains(item.IdStudent))
                .ToList();
        }

        var riskStudents = BuildRiskStudents(filteredPerformance, filteredAttendance);

        var totalStudentsInLessons = filteredLessons.Sum(item => item.TotalStudents);
        var totalPresent = filteredLessons.Sum(item => item.PresentCount);

        decimal? averageAttendance = totalStudentsInLessons == 0
            ? null
            : Math.Round(100m * totalPresent / totalStudentsInLessons, 1);

        var finalGrades = filteredPerformance
            .Where(item => item.FinalGrade.HasValue)
            .Select(item => item.FinalGrade!.Value)
            .ToList();

        decimal? averageFinalGrade = finalGrades.Count == 0
            ? null
            : Math.Round(finalGrades.Average(), 1);

        var response = new OfficeAnalyticsDto
        {
            ProgramsCount = filteredStudents.Select(item => item.IdProgram).Distinct().Count(),
            DisciplinesCount = filteredPerformance
                .Select(item => item.IdDiscipline)
                .Union(filteredLessons.Select(item => item.IdDiscipline))
                .Distinct()
                .Count(),
            GroupsCount = filteredStudents.Select(item => item.IdGroup).Distinct().Count(),
            StudentsCount = filteredStudents.Select(item => item.IdStudent).Distinct().Count(),
            ActiveStudentsCount = filteredStudents.Count(IsActiveStudent),
            TotalLessons = filteredLessons
                .Where(item => item.IdSession.HasValue)
                .Select(item => item.IdSession!.Value)
                .Distinct()
                .Count(),
            AverageAttendancePercent = averageAttendance,
            AverageFinalGrade = averageFinalGrade,
            FailedStudentsCount = filteredPerformance.Count(item => item.FinalGrade.HasValue && item.FinalGrade.Value < 4),
            AtRiskStudentsCount = riskStudents.Count,
            FilledFinalGradesCount = filteredPerformance.Count(item => item.FinalGrade.HasValue),
            ApprovedSheetsCount = filteredPerformance
                .Where(item => item.SheetStatus == "approved")
                .Select(item => item.IdSheet)
                .Where(id => id.HasValue)
                .Distinct()
                .Count(),
            SubmittedSheetsCount = filteredPerformance
                .Where(item => item.SheetStatus == "submitted")
                .Select(item => item.IdSheet)
                .Where(id => id.HasValue)
                .Distinct()
                .Count(),
            DraftSheetsCount = filteredPerformance
                .Where(item => item.SheetStatus == "draft")
                .Select(item => item.IdSheet)
                .Where(id => id.HasValue)
                .Distinct()
                .Count(),
            FilterOptions = filterOptions,
            AttendanceByDate = BuildAttendanceByDate(filteredLessons),
            GradeDistribution = BuildGradeDistribution(filteredPerformance),
            ProgramComparison = BuildProgramComparison(filteredStudents, filteredLessons, filteredPerformance, riskStudents),
            DisciplineComparison = BuildDisciplineComparison(filteredLessons, filteredPerformance, riskStudents),
            GroupComparison = BuildGroupComparison(filteredStudents, filteredLessons, filteredPerformance, riskStudents),
            StudentStatusDistribution = BuildStatusDistribution(filteredStudents),
            RiskStudents = riskStudents.Take(12).ToList()
        };

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

    private static bool MatchesScope(
        int idProgram,
        int courseNo,
        int? startModuleNo,
        int? endModuleNo,
        int? selectedProgramId,
        int? selectedCourseNo,
        int? selectedModuleNo
    )
    {
        if (selectedProgramId.HasValue && idProgram != selectedProgramId.Value)
        {
            return false;
        }

        if (selectedCourseNo.HasValue && courseNo != selectedCourseNo.Value)
        {
            return false;
        }

        if (selectedModuleNo.HasValue)
        {
            var start = startModuleNo ?? selectedModuleNo.Value;
            var end = endModuleNo ?? start;

            if (selectedModuleNo.Value < start || selectedModuleNo.Value > end)
            {
                return false;
            }
        }

        return true;
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

    private static bool IsActiveStudent(StudentStatusRecord student)
    {
        if (string.IsNullOrWhiteSpace(student.StudentStatus))
        {
            return true;
        }

        var status = student.StudentStatus.ToLowerInvariant();

        return !status.Contains("отчис");
    }

    private static OfficeAnalyticsFilterOptionsDto BuildFilterOptions(
        List<StudentStatusRecord> students,
        List<LessonAttendanceRecord> lessons,
        List<StudentPerformanceRecord> performance
    )
    {
        var programs = students
            .GroupBy(item => new { item.IdProgram, item.ProgramName })
            .Select(group => new OfficeAnalyticsProgramOptionDto
            {
                IdProgram = group.Key.IdProgram,
                ProgramName = group.Key.ProgramName
            })
            .OrderBy(item => item.ProgramName)
            .ToList();

        var courseNos = students
            .Select(item => item.CourseNo)
            .Union(lessons.Select(item => item.CourseNo))
            .Union(performance.Select(item => item.CourseNo))
            .Distinct()
            .OrderBy(item => item)
            .ToList();

        var moduleNos = lessons
            .SelectMany(item => ExpandModules(item.StartModuleNo, item.EndModuleNo))
            .Union(performance.SelectMany(item => ExpandModules(item.StartModuleNo, item.EndModuleNo)))
            .Distinct()
            .OrderBy(item => item)
            .ToList();

        return new OfficeAnalyticsFilterOptionsDto
        {
            Programs = programs,
            CourseNos = courseNos,
            ModuleNos = moduleNos
        };
    }

    private static List<OfficeAnalyticsAttendancePointDto> BuildAttendanceByDate(
        List<LessonAttendanceRecord> lessons
    )
    {
        return lessons
            .Where(item => !string.IsNullOrWhiteSpace(item.LessonDate))
            .GroupBy(item => item.LessonDate)
            .Select(group =>
            {
                var total = group.Sum(item => item.TotalStudents);
                var present = group.Sum(item => item.PresentCount);
                var absent = group.Sum(item => item.AbsentCount);
                var date = DateOnly.Parse(group.Key);

                return new OfficeAnalyticsAttendancePointDto
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

    private static List<OfficeAnalyticsGradeDistributionDto> BuildGradeDistribution(
        List<StudentPerformanceRecord> performance
    )
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
            .Select(item => new OfficeAnalyticsGradeDistributionDto
            {
                Label = item.Key,
                Count = item.Value
            })
            .ToList();
    }

    private static List<OfficeAnalyticsRiskStudentDto> BuildRiskStudents(
        List<StudentPerformanceRecord> performance,
        List<StudentAttendanceRecord> attendance
    )
    {
        var attendanceMap = attendance
            .GroupBy(item => $"{item.IdAssignment}:{item.IdStudent}")
            .ToDictionary(
                group => group.Key,
                group => group.First().AttendancePercent
            );

        var risks = new List<OfficeAnalyticsRiskStudentDto>();

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
                reasons.Add("итог ниже 4");
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

            risks.Add(new OfficeAnalyticsRiskStudentDto
            {
                IdStudent = student.IdStudent,
                FullName = student.StudentFullName,
                IdDiscipline = student.IdDiscipline,
                DisciplineName = student.DisciplineName,
                IdGroup = student.IdGroup,
                GroupName = student.GroupName,
                CourseNo = student.CourseNo,
                ProgramName = student.ProgramName,
                AttendancePercent = attendancePercent,
                FinalGrade = student.FinalGrade,
                MissingGradesCount = student.MissingGradesCount,
                RiskReason = string.Join(", ", reasons)
            });
        }

        return risks
            .OrderBy(item => item.FinalGrade ?? 99)
            .ThenBy(item => item.AttendancePercent ?? 100)
            .ThenBy(item => item.FullName)
            .ToList();
    }

    private static List<OfficeAnalyticsProgramComparisonDto> BuildProgramComparison(
        List<StudentStatusRecord> students,
        List<LessonAttendanceRecord> lessons,
        List<StudentPerformanceRecord> performance,
        List<OfficeAnalyticsRiskStudentDto> risks
    )
    {
        return students
            .GroupBy(item => new { item.IdProgram, item.ProgramName })
            .Select(group =>
            {
                var idProgram = group.Key.IdProgram;

                var programLessons = lessons
                    .Where(item => item.IdProgram == idProgram)
                    .ToList();

                var total = programLessons.Sum(item => item.TotalStudents);
                var present = programLessons.Sum(item => item.PresentCount);

                var programPerformance = performance
                    .Where(item => item.IdProgram == idProgram)
                    .ToList();

                var finalGrades = programPerformance
                    .Where(item => item.FinalGrade.HasValue)
                    .Select(item => item.FinalGrade!.Value)
                    .ToList();

                return new OfficeAnalyticsProgramComparisonDto
                {
                    IdProgram = idProgram,
                    ProgramName = group.Key.ProgramName,
                    StudentsCount = group.Select(item => item.IdStudent).Distinct().Count(),
                    GroupsCount = group.Select(item => item.IdGroup).Distinct().Count(),
                    AverageAttendancePercent = total == 0
                        ? null
                        : Math.Round(100m * present / total, 1),
                    AverageFinalGrade = finalGrades.Count == 0
                        ? null
                        : Math.Round(finalGrades.Average(), 1),
                    AtRiskStudentsCount = risks.Count(item => item.ProgramName == group.Key.ProgramName)
                };
            })
            .OrderBy(item => item.ProgramName)
            .ToList();
    }

    private static List<OfficeAnalyticsDisciplineComparisonDto> BuildDisciplineComparison(
        List<LessonAttendanceRecord> lessons,
        List<StudentPerformanceRecord> performance,
        List<OfficeAnalyticsRiskStudentDto> risks
    )
    {
        var keys = lessons
            .Select(item => new { item.IdDiscipline, item.DisciplineName })
            .Union(performance.Select(item => new { item.IdDiscipline, item.DisciplineName }))
            .Distinct()
            .OrderBy(item => item.DisciplineName)
            .ToList();

        return keys.Select(key =>
        {
            var disciplineLessons = lessons
                .Where(item => item.IdDiscipline == key.IdDiscipline)
                .ToList();

            var total = disciplineLessons.Sum(item => item.TotalStudents);
            var present = disciplineLessons.Sum(item => item.PresentCount);

            var disciplinePerformance = performance
                .Where(item => item.IdDiscipline == key.IdDiscipline)
                .ToList();

            var finalGrades = disciplinePerformance
                .Where(item => item.FinalGrade.HasValue)
                .Select(item => item.FinalGrade!.Value)
                .ToList();

            return new OfficeAnalyticsDisciplineComparisonDto
            {
                IdDiscipline = key.IdDiscipline,
                DisciplineName = key.DisciplineName,
                GroupsCount = disciplinePerformance.Select(item => item.IdGroup).Distinct().Count(),
                StudentsCount = disciplinePerformance.Select(item => item.IdStudent).Distinct().Count(),
                AverageAttendancePercent = total == 0
                    ? null
                    : Math.Round(100m * present / total, 1),
                AverageFinalGrade = finalGrades.Count == 0
                    ? null
                    : Math.Round(finalGrades.Average(), 1),
                FailedStudentsCount = disciplinePerformance.Count(item => item.FinalGrade.HasValue && item.FinalGrade.Value < 4),
                AtRiskStudentsCount = risks.Count(item => item.IdDiscipline == key.IdDiscipline)
            };
        }).ToList();
    }

    private static List<OfficeAnalyticsGroupComparisonDto> BuildGroupComparison(
        List<StudentStatusRecord> students,
        List<LessonAttendanceRecord> lessons,
        List<StudentPerformanceRecord> performance,
        List<OfficeAnalyticsRiskStudentDto> risks
    )
    {
        return students
            .GroupBy(item => new
            {
                item.IdGroup,
                item.GroupName,
                item.CourseNo,
                item.ProgramName
            })
            .Select(group =>
            {
                var idGroup = group.Key.IdGroup;

                var groupLessons = lessons
                    .Where(item => item.IdGroup == idGroup)
                    .ToList();

                var total = groupLessons.Sum(item => item.TotalStudents);
                var present = groupLessons.Sum(item => item.PresentCount);

                var groupPerformance = performance
                    .Where(item => item.IdGroup == idGroup)
                    .ToList();

                var finalGrades = groupPerformance
                    .Where(item => item.FinalGrade.HasValue)
                    .Select(item => item.FinalGrade!.Value)
                    .ToList();

                return new OfficeAnalyticsGroupComparisonDto
                {
                    IdGroup = idGroup,
                    GroupName = group.Key.GroupName,
                    CourseNo = group.Key.CourseNo,
                    ProgramName = group.Key.ProgramName,
                    StudentsCount = group.Select(item => item.IdStudent).Distinct().Count(),
                    AverageAttendancePercent = total == 0
                        ? null
                        : Math.Round(100m * present / total, 1),
                    AverageFinalGrade = finalGrades.Count == 0
                        ? null
                        : Math.Round(finalGrades.Average(), 1),
                    AtRiskStudentsCount = risks.Count(item => item.IdGroup == idGroup)
                };
            })
            .OrderBy(item => item.CourseNo)
            .ThenBy(item => item.GroupName)
            .ToList();
    }

    private static List<OfficeAnalyticsStatusDistributionDto> BuildStatusDistribution(
        List<StudentStatusRecord> students
    )
    {
        return students
            .GroupBy(item => string.IsNullOrWhiteSpace(item.StudentStatus)
                ? "Статус не указан"
                : item.StudentStatus
            )
            .Select(group => new OfficeAnalyticsStatusDistributionDto
            {
                StatusName = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(item => item.Count)
            .ToList();
    }

    private class LessonAttendanceRecord
    {
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

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_session")]
        public int? IdSession { get; set; }

        [JsonPropertyName("lesson_date")]
        public string? LessonDate { get; set; }

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

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_full_name")]
        public string StudentFullName { get; set; } = string.Empty;

        [JsonPropertyName("attendance_percent")]
        public decimal? AttendancePercent { get; set; }
    }

    private class StudentPerformanceRecord
    {
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

        [JsonPropertyName("id_program")]
        public int IdProgram { get; set; }

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("start_module_no")]
        public int? StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int? EndModuleNo { get; set; }

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_full_name")]
        public string StudentFullName { get; set; } = string.Empty;

        [JsonPropertyName("missing_grades_count")]
        public int MissingGradesCount { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }

    private class StudentStatusRecord
    {
        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

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

        [JsonPropertyName("student_status")]
        public string? StudentStatus { get; set; }
    }
}