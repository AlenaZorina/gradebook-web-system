using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeResitGroupsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeResitGroupsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/resit-disciplines/{disciplineId:int}/groups")]
    public async Task<ActionResult<List<OfficeResitGroupDto>>> GetResitGroups(
        int idUser,
        int disciplineId
    )
    {
        var query =
            "office_resit_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,students_count,retake_students_count"
            + $"&id_discipline=eq.{disciplineId}"
            + "&order=group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения групп по дисциплине из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeResitGroupRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeResitGroupRow>();

        var response = rows
            .GroupBy(row => new
            {
                row.IdDiscipline,
                row.DisciplineName,
                row.IdGroup,
                row.GroupName,
                row.CourseNo,
                row.IdProgram,
                row.ProgramName,
                row.StartModuleNo,
                row.EndModuleNo,
                row.IdAssignment,
                row.AcademicYear,
                row.TeacherShortName,
                row.IdSheet,
                row.SheetStatus
            })
            .Select(group => new OfficeResitGroupDto
            {
                IdDiscipline = group.Key.IdDiscipline,
                DisciplineName = group.Key.DisciplineName,
                IdGroup = group.Key.IdGroup,
                GroupName = group.Key.GroupName,
                CourseNo = group.Key.CourseNo,
                IdProgram = group.Key.IdProgram,
                ProgramName = group.Key.ProgramName,
                StartModuleNo = group.Key.StartModuleNo,
                EndModuleNo = group.Key.EndModuleNo,
                IdAssignment = group.Key.IdAssignment,
                AcademicYear = group.Key.AcademicYear,
                TeacherShortName = group.Key.TeacherShortName,
                IdSheet = group.Key.IdSheet,
                SheetStatus = group.Key.SheetStatus ?? string.Empty,
                StudentsCount = group.Sum(item => item.StudentsCount),
                RetakeStudentsCount = group.Sum(item => item.RetakeStudentsCount)
            })
            .OrderBy(item => item.GroupName)
            .ToList();

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/resit-disciplines/{disciplineId:int}/groups/{groupId:int}/students")]
    public async Task<ActionResult<OfficeResitStudentListDto>> GetResitStudents(
        int idUser,
        int disciplineId,
        int groupId
    )
    {
        var groupQuery =
            "office_resit_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,retake_students_count"
            + $"&id_discipline=eq.{disciplineId}"
            + $"&id_group=eq.{groupId}"
            + "&limit=1";

        var groupResult = await _supabase.GetAsync(groupQuery);

        if (!groupResult.Success)
        {
            return StatusCode(
                groupResult.StatusCode,
                new
                {
                    message = "Ошибка получения информации о группе из Supabase",
                    details = groupResult.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var groupRows = JsonSerializer.Deserialize<List<SupabaseOfficeResitGroupRow>>(
            groupResult.Body,
            options
        ) ?? new List<SupabaseOfficeResitGroupRow>();

        var groupInfo = groupRows.FirstOrDefault();

        if (groupInfo is null)
        {
            return NotFound(new { message = "Группа по выбранной дисциплине не найдена" });
        }

        var studentsQuery =
            "office_resit_students_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,id_student,student_surname,student_name,student_fathername,record_book_no,final_grade"
            + $"&id_discipline=eq.{disciplineId}"
            + $"&id_group=eq.{groupId}"
            + "&order=student_surname.asc,student_name.asc";

        var studentsResult = await _supabase.GetAsync(studentsQuery);

        if (!studentsResult.Success)
        {
            return StatusCode(
                studentsResult.StatusCode,
                new
                {
                    message = "Ошибка получения списка студентов на пересдачу из Supabase",
                    details = studentsResult.Body
                }
            );
        }

        var studentRows = JsonSerializer.Deserialize<List<SupabaseOfficeResitStudentRow>>(
            studentsResult.Body,
            options
        ) ?? new List<SupabaseOfficeResitStudentRow>();

        var students = studentRows
            .Select(row => new OfficeResitStudentDto
            {
                IdStudent = row.IdStudent,
                FullName = BuildFullName(row.StudentSurname, row.StudentName, row.StudentFathername),
                RecordBookNo = row.RecordBookNo,
                ProgramName = row.ProgramName,
                GroupName = row.GroupName,
                FinalGrade = row.FinalGrade
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var response = new OfficeResitStudentListDto
        {
            IdDiscipline = groupInfo.IdDiscipline,
            DisciplineName = groupInfo.DisciplineName,
            IdGroup = groupInfo.IdGroup,
            GroupName = groupInfo.GroupName,
            CourseNo = groupInfo.CourseNo,
            IdProgram = groupInfo.IdProgram,
            ProgramName = groupInfo.ProgramName,
            IdAssignment = groupInfo.IdAssignment,
            AcademicYear = groupInfo.AcademicYear,
            TeacherShortName = groupInfo.TeacherShortName,
            RetakeStudentsCount = students.Count,
            Students = students
        };

        return Ok(response);
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private class SupabaseOfficeResitGroupRow
    {
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
        public int StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int EndModuleNo { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("teacher_short_name")]
        public string TeacherShortName { get; set; } = string.Empty;

        [JsonPropertyName("id_sheet")]
        public int? IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string? SheetStatus { get; set; }

        [JsonPropertyName("students_count")]
        public int StudentsCount { get; set; }

        [JsonPropertyName("retake_students_count")]
        public int RetakeStudentsCount { get; set; }
    }

    private class SupabaseOfficeResitStudentRow
    {
        [JsonPropertyName("id_student")]
        public int IdStudent { get; set; }

        [JsonPropertyName("student_surname")]
        public string StudentSurname { get; set; } = string.Empty;

        [JsonPropertyName("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student_fathername")]
        public string? StudentFathername { get; set; }

        [JsonPropertyName("record_book_no")]
        public string RecordBookNo { get; set; } = string.Empty;

        [JsonPropertyName("program_name")]
        public string ProgramName { get; set; } = string.Empty;

        [JsonPropertyName("group_name")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("final_grade")]
        public decimal FinalGrade { get; set; }
    }
}