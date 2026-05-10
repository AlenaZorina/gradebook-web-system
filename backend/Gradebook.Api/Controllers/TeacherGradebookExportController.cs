using System.Text.Json;
using System.Text.Json.Serialization;
using ClosedXML.Excel;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class TeacherGradebookExportController : ControllerBase
{
    private const int FirstStudentRow = 15;
    private const int TemplateStudentRows = 25;
    private const int TemplateLastStudentRow = 39;

    private const int ControlStartColumn = 19; // S
    private const int ControlMaxColumns = 8;   // S:Z
    private const int FinalGradeColumn = 29;   // AC

    private readonly SupabaseRestClient _supabase;
    private readonly IWebHostEnvironment _environment;

    public TeacherGradebookExportController(
        SupabaseRestClient supabase,
        IWebHostEnvironment environment
    )
    {
        _supabase = supabase;
        _environment = environment;
    }

    [HttpGet("{idUser:int}/gradebook/export")]
    public async Task<IActionResult> ExportGradebook(
        int idUser,
        [FromQuery] int? disciplineId,
        [FromQuery] int? groupId
    )
    {
        if (!disciplineId.HasValue || !groupId.HasValue)
        {
            return BadRequest(new { message = "Необходимо выбрать дисциплину и группу" });
        }

        var ensureResult = await _supabase.RpcAsync(
            "ensure_teacher_gradebook",
            new
            {
                p_teacher_user_id = idUser,
                p_id_discipline = disciplineId.Value,
                p_id_group = groupId.Value
            }
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
                    message = "Не удалось определить ведомость для экспорта",
                    details = ensureResult.Body
                }
            );
        }

        var query = "teacher_gradebook_view"
            + "?select=id_sheet,sheet_status,teacher_user_id,teacher_surname,teacher_name,teacher_fathername,id_assignment,academic_year,id_discipline,discipline_name,id_group,group_name,course_no,start_module_no,end_module_no,id_student,student_surname,student_name,student_fathername,record_book_no,id_element,element_name,element_order_no,element_weight,id_grade,grade_value,id_final_grade,final_grade"
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
                    message = "Ошибка получения данных ведомости для экспорта",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var records = JsonSerializer.Deserialize<List<ExportGradebookRecord>>(
            result.Body,
            options
        ) ?? new List<ExportGradebookRecord>();

        if (records.Count == 0)
        {
            return NotFound(new { message = "Нет данных для экспорта ведомости" });
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
            .Select(group => new ExportElement
            {
                IdElement = group.Key.IdElement,
                ElementName = group.Key.ElementName,
                OrderNo = group.Key.ElementOrderNo,
                Weight = group.Key.ElementWeight
            })
            .OrderBy(item => item.OrderNo)
            .ToList();

        if (elements.Count > ControlMaxColumns)
        {
            return BadRequest(new
            {
                message = $"В шаблоне предусмотрено максимум {ControlMaxColumns} элементов контроля. Сейчас в формуле: {elements.Count}"
            });
        }

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
                var grades = elements
                    .Select(element =>
                    {
                        var record = group.First(item => item.IdElement == element.IdElement);

                        return new ExportGrade
                        {
                            IdElement = record.IdElement,
                            GradeValue = record.GradeValue
                        };
                    })
                    .ToList();

                return new ExportStudent
                {
                    IdStudent = group.Key.IdStudent,
                    FullName = BuildFullName(
                        group.Key.StudentSurname,
                        group.Key.StudentName,
                        group.Key.StudentFathername
                    ),
                    RecordBookNo = group.Key.RecordBookNo,
                    FinalGrade = group.Key.FinalGrade,
                    Grades = grades
                };
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var templatePath = Path.Combine(
            _environment.ContentRootPath,
            "Templates",
            "Рабочая ведомость шаблон.xlsx"
        );

        if (!System.IO.File.Exists(templatePath))
        {
            return StatusCode(
                500,
                new
                {
                    message = "Файл шаблона ведомости не найден",
                    details = templatePath
                }
            );
        }

        using var workbook = new XLWorkbook(templatePath);
        var worksheet = workbook.Worksheet("Ведомость");

        FillHeader(worksheet, first);
        FillControlHeaders(worksheet, elements);
        FillStudents(worksheet, students, elements);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        var fileName =
            $"Рабочая ведомость_{SanitizeFileName(first.DisciplineName)}_{SanitizeFileName(first.GroupName)}.xlsx";

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName
        );
    }

    private static void FillHeader(IXLWorksheet worksheet, ExportGradebookRecord first)
    {
        var moduleText = first.StartModuleNo == first.EndModuleNo
            ? $"{first.StartModuleNo} модуль"
            : $"{first.StartModuleNo}-{first.EndModuleNo} модули";

        worksheet.Cell("A5").Value = $"Курс: Бакалавриат {first.CourseNo} курс";
        worksheet.Cell("C5").Value = $"{first.AcademicYear} учебный год";
        worksheet.Cell("A6").Value = $"Модуль/семестр: {moduleText}";
        worksheet.Cell("A7").Value = $"Группа: {first.GroupName}";
        worksheet.Cell("C7").Value = $"Дисциплина: {first.DisciplineName}";
        worksheet.Cell("A8").Value =
            $"Фамилия, имя, отчество преподавателя: {BuildFullName(first.TeacherSurname, first.TeacherName, first.TeacherFathername)}";
    }

    private static void FillControlHeaders(
        IXLWorksheet worksheet,
        List<ExportElement> elements
    )
    {
        worksheet.Range(14, ControlStartColumn, 14, ControlStartColumn + ControlMaxColumns - 1)
            .Clear(XLClearOptions.Contents);

        for (var i = 0; i < elements.Count; i++)
        {
            var cell = worksheet.Cell(14, ControlStartColumn + i);
            cell.Value = elements[i].ElementName;
            cell.Style.Alignment.WrapText = true;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
    }

    private static void FillStudents(
        IXLWorksheet worksheet,
        List<ExportStudent> students,
        List<ExportElement> elements
    )
    {
        var totalRows = Math.Max(students.Count, TemplateStudentRows);

        if (students.Count > TemplateStudentRows)
        {
            var rowsToInsert = students.Count - TemplateStudentRows;
            worksheet.Row(TemplateLastStudentRow).InsertRowsBelow(rowsToInsert);

            for (
                var row = TemplateLastStudentRow + 1;
                row <= TemplateLastStudentRow + rowsToInsert;
                row++
            )
            {
                worksheet.Row(row).Style = worksheet.Row(TemplateLastStudentRow).Style;
                worksheet.Row(row).Height = worksheet.Row(TemplateLastStudentRow).Height;
            }
        }

        worksheet.Range(
            FirstStudentRow,
            1,
            FirstStudentRow + totalRows - 1,
            FinalGradeColumn
        ).Clear(XLClearOptions.Contents);

        for (var i = 0; i < students.Count; i++)
        {
            var student = students[i];
            var row = FirstStudentRow + i;

            worksheet.Cell(row, 1).Value = i + 1;
            worksheet.Cell(row, 2).Value = student.FullName;

            for (var elementIndex = 0; elementIndex < elements.Count; elementIndex++)
            {
                var element = elements[elementIndex];
                var grade = student.Grades.FirstOrDefault(item => item.IdElement == element.IdElement);

                if (grade?.GradeValue is decimal gradeValue)
                {
                    worksheet.Cell(row, ControlStartColumn + elementIndex).Value = (double)gradeValue;
                }
            }

            if (student.FinalGrade is decimal finalGrade)
            {
                worksheet.Cell(row, FinalGradeColumn).Value = (double)finalGrade;
            }
        }
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.Join(
            " ",
            new[]
            {
                surname,
                name,
                fathername
            }.Where(part => !string.IsNullOrWhiteSpace(part))
        );
    }

    private static string SanitizeFileName(string value)
    {
        foreach (var invalidChar in Path.GetInvalidFileNameChars())
        {
            value = value.Replace(invalidChar, '_');
        }

        return value.Trim();
    }

    private static EnsureGradebookResponse? DeserializeEnsurePayload(string body)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<EnsureGradebookResponse>(body, options);
    }

    private class EnsureGradebookResponse
    {
        [JsonPropertyName("idAssignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("idSheet")]
        public int IdSheet { get; set; }
    }

    private class ExportGradebookRecord
    {
        [JsonPropertyName("id_sheet")]
        public int IdSheet { get; set; }

        [JsonPropertyName("sheet_status")]
        public string SheetStatus { get; set; } = string.Empty;

        [JsonPropertyName("teacher_user_id")]
        public int TeacherUserId { get; set; }

        [JsonPropertyName("teacher_surname")]
        public string TeacherSurname { get; set; } = string.Empty;

        [JsonPropertyName("teacher_name")]
        public string TeacherName { get; set; } = string.Empty;

        [JsonPropertyName("teacher_fathername")]
        public string? TeacherFathername { get; set; }

        [JsonPropertyName("id_assignment")]
        public int IdAssignment { get; set; }

        [JsonPropertyName("academic_year")]
        public string AcademicYear { get; set; } = string.Empty;

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

        [JsonPropertyName("start_module_no")]
        public int StartModuleNo { get; set; }

        [JsonPropertyName("end_module_no")]
        public int EndModuleNo { get; set; }

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

    private class ExportElement
    {
        public int IdElement { get; set; }
        public string ElementName { get; set; } = string.Empty;
        public int OrderNo { get; set; }
        public decimal Weight { get; set; }
    }

    private class ExportStudent
    {
        public int IdStudent { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string RecordBookNo { get; set; } = string.Empty;
        public decimal? FinalGrade { get; set; }
        public List<ExportGrade> Grades { get; set; } = new();
    }

    private class ExportGrade
    {
        public int IdElement { get; set; }
        public decimal? GradeValue { get; set; }
    }
}