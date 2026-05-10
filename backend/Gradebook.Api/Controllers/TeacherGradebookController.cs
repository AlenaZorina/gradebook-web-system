using System.Text.Json;
using System.Text.Json.Serialization;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherGradebookController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public TeacherGradebookController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/gradebook")]
    public async Task<ActionResult<TeacherGradebookDto>> GetGradebook(
        int idUser,
        [FromQuery] int? disciplineId,
        [FromQuery] int? groupId
    )
    {
        if (!disciplineId.HasValue || !groupId.HasValue)
        {
            return BadRequest(new { message = "Необходимо выбрать дисциплину и группу" });
        }

        var ensureResult = await EnsureGradebookAsync(
            idUser,
            disciplineId.Value,
            groupId.Value
        );

        if (!ensureResult.Success)
        {
            return StatusCode(
                ensureResult.StatusCode,
                new
                {
                    message = "Ошибка подготовки ведомости",
                    details = ensureResult.Body
                }
            );
        }

        var ensurePayload = DeserializeEnsurePayload(ensureResult.Body);

        if (ensurePayload is null || ensurePayload.IdAssignment <= 0 || ensurePayload.IdSheet <= 0)
        {
            return StatusCode(
                500,
                new
                {
                    message = "Не удалось определить ведомость для выбранной дисциплины и группы",
                    details = ensureResult.Body
                }
            );
        }

        var query = "teacher_gradebook_view"
    + "?select=id_sheet,sheet_status,teacher_user_id,id_assignment,id_discipline,discipline_name,id_group,group_name,course_no,id_student,student_surname,student_name,student_fathername,record_book_no,id_element,element_name,element_order_no,element_weight,id_grade,grade_value,id_final_grade,final_grade"
    + $"&teacher_user_id=eq.{idUser}"
    + $"&id_discipline=eq.{disciplineId.Value}"
    + $"&id_group=eq.{groupId.Value}"
    + $"&id_assignment=eq.{ensurePayload.IdAssignment}"
    + $"&id_sheet=eq.{ensurePayload.IdSheet}";
        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения ведомости из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<SupabaseGradebookRecord>>(
            result.Body,
            options
        ) ?? new List<SupabaseGradebookRecord>();

        if (records.Count == 0)
        {
            return NotFound(
                new
                {
                    message = "Ведомость для выбранной дисциплины и группы не найдена",
                    details = "Данные были подготовлены, но teacher_gradebook_view не вернул строки. Проверьте view teacher_gradebook_view."
                }
            );
        }

        var first = records.First();

        var elements = records
    .GroupBy(item => new
    {
        item.IdElement,
        item.ElementName,
        item.ElementOrderNo,
        item.ElementWeight
    })
    .Select(group => new GradebookElementDto
    {
        IdElement = group.Key.IdElement,
        ElementName = group.Key.ElementName,
        OrderNo = group.Key.ElementOrderNo,
        Weight = group.Key.ElementWeight
    })
            .OrderBy(item => item.OrderNo)
            .ToList();

        var students = records
            .GroupBy(item => new
            {
                item.IdStudent,
                item.StudentSurname,
                item.StudentName,
                item.StudentFathername,
                item.RecordBookNo,
                item.IdFinalGrade,
                item.FinalGrade
            })
            .Select(group =>
            {
                var fullName =
                    $"{group.Key.StudentSurname} {group.Key.StudentName.FirstOrDefault()}."
                    + $"{(string.IsNullOrWhiteSpace(group.Key.StudentFathername) ? "" : group.Key.StudentFathername![0] + ".")}";

                var grades = elements
                    .Select(element =>
                    {
                        var record = group.First(item => item.IdElement == element.IdElement);

                        return new GradebookGradeDto
                        {
                            IdGrade = record.IdGrade,
                            IdElement = record.IdElement,
                            GradeValue = record.GradeValue
                        };
                    })
                    .ToList();

                return new GradebookStudentDto
                {
                    IdStudent = group.Key.IdStudent,
                    FullName = fullName,
                    RecordBookNo = group.Key.RecordBookNo,
                    IdFinalGrade = group.Key.IdFinalGrade,
                    FinalGrade = group.Key.FinalGrade,
                    Grades = grades
                };
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var response = new TeacherGradebookDto
        {
            TeacherUserId = first.TeacherUserId,
            IdSheet = first.IdSheet,
            SheetStatus = first.SheetStatus,
            IdDiscipline = first.IdDiscipline,
            DisciplineName = first.DisciplineName,
            IdGroup = first.IdGroup,
            GroupName = first.GroupName,
            CourseNo = first.CourseNo,
            Elements = elements,
            Students = students
        };

        return Ok(response);
    }

    [HttpPut("{idUser:int}/gradebook")]
    public async Task<IActionResult> UpdateGradebook(
        int idUser,
        [FromQuery] int? disciplineId,
        [FromQuery] int? groupId,
        [FromBody] UpdateTeacherGradebookRequestDto request
    )
    {
        if (!disciplineId.HasValue || !groupId.HasValue)
        {
            return BadRequest(new { message = "Необходимо выбрать дисциплину и группу" });
        }

        if (request.IdSheet <= 0)
        {
            return BadRequest(new { message = "Не передан идентификатор ведомости" });
        }

        var allowedQuery = "teacher_gradebook_view"
            + "?select=id_sheet,id_grade,id_final_grade,id_student,id_element"
            + $"&teacher_user_id=eq.{idUser}"
            + $"&id_discipline=eq.{disciplineId.Value}"
            + $"&id_group=eq.{groupId.Value}"
            + $"&id_sheet=eq.{request.IdSheet}";

        var allowedResult = await _supabase.GetAsync(allowedQuery);

        if (!allowedResult.Success)
        {
            return StatusCode(
                allowedResult.StatusCode,
                new
                {
                    message = "Ошибка проверки ведомости",
                    details = allowedResult.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var allowedRows = JsonSerializer.Deserialize<List<GradebookAllowedRecord>>(
            allowedResult.Body,
            options
        ) ?? new List<GradebookAllowedRecord>();

        if (allowedRows.Count == 0)
        {
            return NotFound(new { message = "Ведомость для выбранной дисциплины и группы не найдена" });
        }

        var allowedGradeIds = allowedRows
            .Select(item => item.IdGrade)
            .ToHashSet();

        var allowedFinalIds = allowedRows
            .Select(item => item.IdFinalGrade)
            .ToHashSet();

        var updated = 0;

        foreach (var student in request.Students)
        {
            foreach (var grade in student.Grades)
            {
                if (!allowedGradeIds.Contains(grade.IdGrade))
                {
                    return BadRequest(new { message = "Попытка изменить чужую оценку" });
                }

                if (
    grade.GradeValue.HasValue
    && (
        grade.GradeValue.Value < 0
        || grade.GradeValue.Value > 10
        || !IsWholeNumber(grade.GradeValue.Value)
    )
)
{
    return BadRequest(new { message = "Оценка должна быть целым числом от 0 до 10" });
}

                var updatePath = $"grades?id_grade=eq.{grade.IdGrade}";

                var updateResult = await _supabase.PatchAsync(
                    updatePath,
                    new
                    {
                        grade_value = grade.GradeValue
                    }
                );

                if (!updateResult.Success)
                {
                    return StatusCode(
                        updateResult.StatusCode,
                        new
                        {
                            message = "Ошибка сохранения оценки",
                            details = updateResult.Body
                        }
                    );
                }

                updated++;
            }

            if (!allowedFinalIds.Contains(student.IdFinalGrade))
            {
                return BadRequest(new { message = "Попытка изменить чужую итоговую оценку" });
            }

            if (
    student.FinalGrade.HasValue
    && (
        student.FinalGrade.Value < 0
        || student.FinalGrade.Value > 10
        || !IsWholeNumber(student.FinalGrade.Value)
    )
)
{
    return BadRequest(new { message = "Итоговая оценка должна быть целым числом от 0 до 10" });
}

            var finalUpdatePath = $"final_grades?id_final_grade=eq.{student.IdFinalGrade}";

            var finalUpdateResult = await _supabase.PatchAsync(
                finalUpdatePath,
                new
                {
                    final_grade = student.FinalGrade
                }
            );

            if (!finalUpdateResult.Success)
            {
                return StatusCode(
                    finalUpdateResult.StatusCode,
                    new
                    {
                        message = "Ошибка сохранения итоговой оценки",
                        details = finalUpdateResult.Body
                    }
                );
            }

            updated++;
        }

        return Ok(new { message = "Ведомость сохранена", updated });
    }

    [HttpPost("{idUser:int}/gradebook/{idSheet:int}/submit")]
    public async Task<IActionResult> SubmitGradebook(
        int idUser,
        int idSheet,
        [FromQuery] int? disciplineId,
        [FromQuery] int? groupId
    )
    {
        if (!disciplineId.HasValue || !groupId.HasValue)
        {
            return BadRequest(new { message = "Необходимо выбрать дисциплину и группу" });
        }

        var sheetQuery = "teacher_gradebook_view"
            + "?select=id_sheet,final_grade"
            + $"&teacher_user_id=eq.{idUser}"
            + $"&id_discipline=eq.{disciplineId.Value}"
            + $"&id_group=eq.{groupId.Value}"
            + $"&id_sheet=eq.{idSheet}";

        var sheetResult = await _supabase.GetAsync(sheetQuery);

        if (!sheetResult.Success)
        {
            return StatusCode(
                sheetResult.StatusCode,
                new
                {
                    message = "Ошибка проверки ведомости",
                    details = sheetResult.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<GradebookSubmitRecord>>(
            sheetResult.Body,
            options
        ) ?? new List<GradebookSubmitRecord>();

        if (rows.Count == 0)
        {
            return NotFound(new { message = "Ведомость не найдена" });
        }

        if (rows.Any(item => !item.FinalGrade.HasValue))
        {
            return BadRequest(new { message = "Нельзя отправить ведомость: не у всех студентов проставлена итоговая оценка" });
        }

        var submitResult = await _supabase.PatchAsync(
            $"grade_sheets?id_sheet=eq.{idSheet}",
            new
            {
                status = "submitted",
                submitted_at = DateTime.UtcNow
            }
        );

        if (!submitResult.Success)
        {
            return StatusCode(
                submitResult.StatusCode,
                new
                {
                    message = "Ошибка отправки ведомости на утверждение",
                    details = submitResult.Body
                }
            );
        }

        return Ok(new { message = "Ведомость отправлена на утверждение" });
    }

    private async Task<(bool Success, int StatusCode, string Body)> EnsureGradebookAsync(
        int idUser,
        int disciplineId,
        int groupId
    )
    {
        return await _supabase.RpcAsync(
            "ensure_teacher_gradebook",
            new
            {
                p_teacher_user_id = idUser,
                p_id_discipline = disciplineId,
                p_id_group = groupId
            }
        );
    }

    private static EnsureGradebookResponse? DeserializeEnsurePayload(string body)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<EnsureGradebookResponse>(body, options);
    }

    private static bool IsWholeNumber(decimal value)
{
    return value == decimal.Truncate(value);
}

    private class EnsureGradebookResponse
    {
        [JsonPropertyName("idAssignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("idSheet")]
        public int IdSheet { get; set; }
    }

    private class SupabaseGradebookRecord
    {
        [JsonPropertyName("id_sheet")]
        public int IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string SheetStatus { get; set; } = string.Empty;

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

        [JsonPropertyName("student_surname")]
        public string StudentSurname { get; set; } = string.Empty;

        [JsonPropertyName("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student_fathername")]
        public string? StudentFathername { get; set; }

        [JsonPropertyName("record_book_no")]
        public string RecordBookNo { get; set; } = string.Empty;

        [JsonPropertyName("id_element")]
        public int IdElement { get; set; }

        [JsonPropertyName("element_name")]
        public string ElementName { get; set; } = string.Empty;

        [JsonPropertyName("element_order_no")]
        public int ElementOrderNo { get; set; }

        [JsonPropertyName("element_weight")]
public decimal ElementWeight { get; set; }

        [JsonPropertyName("id_grade")]
        public int IdGrade { get; set; }

        [JsonPropertyName("grade_value")]
        public decimal? GradeValue { get; set; }

        [JsonPropertyName("id_final_grade")]
        public int IdFinalGrade { get; set; }

        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }

    private class GradebookAllowedRecord
    {
        [JsonPropertyName("id_grade")]
        public int IdGrade { get; set; }

        [JsonPropertyName("id_final_grade")]
        public int IdFinalGrade { get; set; }
    }

    private class GradebookSubmitRecord
    {
        [JsonPropertyName("final_grade")]
        public decimal? FinalGrade { get; set; }
    }
}