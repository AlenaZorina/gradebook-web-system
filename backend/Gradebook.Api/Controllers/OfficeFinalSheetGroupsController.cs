using System.Text.Json;
using System.Text.Json.Serialization;
using ClosedXML.Excel;
using Gradebook.Api.Dtos;
using Gradebook.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class OfficeFinalSheetGroupsController : ControllerBase
{
    private readonly SupabaseRestClient _supabase;

    public OfficeFinalSheetGroupsController(SupabaseRestClient supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("{idUser:int}/office/final-sheet-disciplines/{disciplineId:int}/groups")]
    public async Task<ActionResult<List<OfficeFinalSheetGroupDto>>> GetFinalSheetGroups(
        int idUser,
        int disciplineId
    )
    {
        var query =
            "office_final_sheet_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,start_module_no,end_module_no,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,students_count,filled_final_grades_count,failed_students_count"
            + $"&id_discipline=eq.{disciplineId}"
            + "&order=group_name.asc";

        var result = await _supabase.GetAsync(query);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new
                {
                    message = "Ошибка получения групп для итоговых ведомостей из Supabase",
                    details = result.Body
                }
            );
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetGroupRow>>(
            result.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetGroupRow>();

        var response = rows
            .Where(row => row.IdGroup > 0 || !string.IsNullOrWhiteSpace(row.GroupName))
            .GroupBy(row => NormalizeGroupKey(row))
            .Select(group =>
            {
                var first = group.First();

                var studentsCount = group.Max(item => item.StudentsCount);
                var filledFinalGradesCount = group.Max(item => item.FilledFinalGradesCount);
                var failedStudentsCount = group.Max(item => item.FailedStudentsCount);

                decimal? filledPercent = studentsCount == 0
                    ? null
                    : Math.Round((decimal)filledFinalGradesCount / studentsCount * 100m, 1);

                return new OfficeFinalSheetGroupDto
                {
                    IdDiscipline = first.IdDiscipline,
                    DisciplineName = first.DisciplineName,
                    IdGroup = first.IdGroup,
                    GroupName = first.GroupName,
                    CourseNo = first.CourseNo,
                    IdProgram = first.IdProgram,
                    ProgramName = first.ProgramName,
                    StartModuleNo = first.StartModuleNo,
                    EndModuleNo = first.EndModuleNo,
                    IdAssignment = first.IdAssignment,
                    AcademicYear = first.AcademicYear,
                    TeacherShortName = first.TeacherShortName,
                    IdSheet = first.IdSheet,
                    SheetStatus = first.SheetStatus ?? string.Empty,
                    StudentsCount = studentsCount,
                    FilledFinalGradesCount = filledFinalGradesCount,
                    FailedStudentsCount = failedStudentsCount,
                    FilledPercent = filledPercent
                };
            })
            .OrderBy(item => item.GroupName)
            .ToList();

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/final-sheet-disciplines/{disciplineId:int}/groups/{groupId:int}/sheet")]
    public async Task<ActionResult<OfficeFinalSheetDto>> GetFinalSheet(
        int idUser,
        int disciplineId,
        int groupId
    )
    {
        var groupQuery =
            "office_final_sheet_groups_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status"
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

        var groupRows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetGroupRow>>(
            groupResult.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetGroupRow>();

        var groupInfo = groupRows.FirstOrDefault();

        if (groupInfo is null)
        {
            return NotFound(new { message = "Группа по выбранной дисциплине не найдена" });
        }

        /*
         * Важно: фильтруем не только по дисциплине и группе, но и по id_assignment.
         * Без этого у некоторых дисциплин подтягиваются строки нескольких назначений,
         * из-за чего элементы контроля визуально задваиваются: ЛР1, ЛР1, ЛР2, ЛР2 и т.д.
         */
        var sheetQuery =
            "office_final_sheet_rows_view"
            + "?select=id_discipline,discipline_name,id_group,group_name,course_no,id_program,program_name,id_assignment,academic_year,teacher_short_name,id_sheet,sheet_status,formula_text,id_element,element_name,control_type,weight,element_order_no,id_student,student_surname,student_name,student_fathername,record_book_no,grade_value,final_grade"
            + $"&id_discipline=eq.{disciplineId}"
            + $"&id_group=eq.{groupId}"
            + $"&id_assignment=eq.{groupInfo.IdAssignment}"
            + "&order=student_surname.asc,student_name.asc,element_order_no.asc";

        var sheetResult = await _supabase.GetAsync(sheetQuery);

        if (!sheetResult.Success)
        {
            return StatusCode(
                sheetResult.StatusCode,
                new
                {
                    message = "Ошибка получения итоговой ведомости из Supabase",
                    details = sheetResult.Body
                }
            );
        }

        var rows = JsonSerializer.Deserialize<List<SupabaseOfficeFinalSheetRow>>(
            sheetResult.Body,
            options
        ) ?? new List<SupabaseOfficeFinalSheetRow>();

        /*
         * Элементы контроля схлопываем по нормализованному названию.
         * Это убирает дубли вроде "ЛР1", "ЛР1", если они пришли с разными техническими idElement.
         */
        var elementGroups = rows
            .Where(row => row.IdElement.HasValue)
            .GroupBy(NormalizeElementKey)
            .Select(group =>
            {
                var orderedRows = group
                    .OrderBy(row => row.ElementOrderNo ?? int.MaxValue)
                    .ThenBy(row => row.IdElement!.Value)
                    .ToList();

                var first = orderedRows.First();

                return new OfficeFinalSheetElementGroupForCalc
                {
                    IdElement = first.IdElement!.Value,
                    ElementIds = orderedRows
                        .Select(row => row.IdElement!.Value)
                        .Distinct()
                        .ToHashSet(),
                    ElementName = first.ElementName ?? string.Empty,
                    ControlType = first.ControlType,
                    Weight = first.Weight,
                    OrderNo = first.ElementOrderNo ?? 0
                };
            })
            .OrderBy(item => item.OrderNo)
            .ThenBy(item => item.IdElement)
            .ToList();

        var elements = elementGroups
            .Select(group => new OfficeFinalSheetElementDto
            {
                IdElement = group.IdElement,
                ElementName = group.ElementName,
                ControlType = group.ControlType,
                Weight = group.Weight,
                OrderNo = group.OrderNo
            })
            .ToList();

        var students = rows
            .GroupBy(row => new
            {
                row.IdStudent,
                row.StudentSurname,
                row.StudentName,
                row.StudentFathername,
                row.RecordBookNo
            })
            .Select(group =>
            {
                var grades = elementGroups
                    .Select(elementGroup =>
                    {
                        var gradeValue = GetFirstGradeValue(group, elementGroup.ElementIds);

                        return new OfficeFinalSheetStudentGradeDto
                        {
                            IdElement = elementGroup.IdElement,
                            GradeValue = gradeValue
                        };
                    })
                    .ToList();

                var studentElements = elementGroups
                    .Select(elementGroup =>
                    {
                        var gradeValue = grades
                            .FirstOrDefault(grade => grade.IdElement == elementGroup.IdElement)
                            ?.GradeValue;

                        return new OfficeFinalSheetStudentElementForCalc
                        {
                            ElementName = elementGroup.ElementName,
                            ControlType = elementGroup.ControlType,
                            Weight = elementGroup.Weight,
                            GradeValue = gradeValue
                        };
                    })
                    .ToList();

                var finalGrade = group
                    .Select(row => row.FinalGrade)
                    .FirstOrDefault(value => value.HasValue);

                return new OfficeFinalSheetStudentDto
                {
                    IdStudent = group.Key.IdStudent,
                    FullName = BuildFullName(
                        group.Key.StudentSurname,
                        group.Key.StudentName,
                        group.Key.StudentFathername
                    ),
                    RecordBookNo = group.Key.RecordBookNo ?? string.Empty,
                    AccumulatedGrade = CalculateAccumulatedGrade(studentElements),
                    ExamGrade = CalculateExamGrade(studentElements),
                    FinalGrade = finalGrade ?? CalculatePreliminaryFinalGrade(studentElements),
                    Grades = grades
                };
            })
            .OrderBy(item => item.FullName)
            .ToList();

        var formulaText = rows
            .Select(row => row.FormulaText)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))
            ?? string.Empty;

        var response = new OfficeFinalSheetDto
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
            IdSheet = groupInfo.IdSheet,
            SheetStatus = groupInfo.SheetStatus ?? string.Empty,
            FormulaText = formulaText,
            Elements = elements,
            Students = students
        };

        return Ok(response);
    }

    [HttpGet("{idUser:int}/office/final-sheet-disciplines/{disciplineId:int}/groups/{groupId:int}/sheet/export")]
    public async Task<IActionResult> ExportFinalSheet(
        int idUser,
        int disciplineId,
        int groupId
    )
    {
        var sheetResult = await GetFinalSheet(idUser, disciplineId, groupId);

        OfficeFinalSheetDto? sheet = null;

        if (sheetResult.Value is not null)
        {
            sheet = sheetResult.Value;
        }
        else if (sheetResult.Result is OkObjectResult okResult)
        {
            sheet = okResult.Value as OfficeFinalSheetDto;
        }

        if (sheet is null)
        {
            if (sheetResult.Result is NotFoundObjectResult notFoundResult)
            {
                return NotFound(notFoundResult.Value);
            }

            if (sheetResult.Result is ObjectResult objectResult && sheetResult.Result is not OkObjectResult)
            {
                return StatusCode(
                    objectResult.StatusCode ?? StatusCodes.Status500InternalServerError,
                    objectResult.Value
                );
            }

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "Не удалось подготовить данные итоговой ведомости для экспорта" }
            );
        }

        var fileBytes = BuildFinalSheetExcel(sheet);

        if (fileBytes.Length == 0)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "Файл итоговой ведомости сформирован пустым" }
            );
        }

        var fileName =
            $"final-sheet-{SanitizeFileName(sheet.DisciplineName)}-{SanitizeFileName(sheet.GroupName)}.xlsx";

        return File(
            fileBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName
        );
    }

    private static byte[] BuildFinalSheetExcel(OfficeFinalSheetDto sheet)
    {
        var templatePath = Path.Combine(
            AppContext.BaseDirectory,
            "Templates",
            "Рабочая ведомость шаблон.xlsx"
        );

        using var workbook = System.IO.File.Exists(templatePath)
            ? new XLWorkbook(templatePath)
            : new XLWorkbook();

        var worksheet = workbook.Worksheets.FirstOrDefault()
            ?? workbook.Worksheets.Add("Ведомость");

        FillFinalSheetTemplate(worksheet, sheet);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return stream.ToArray();
    }

    private static void FillFinalSheetTemplate(IXLWorksheet worksheet, OfficeFinalSheetDto sheet)
    {
        worksheet.Cell("A5").Value = $"Курс: Бакалавриат {sheet.CourseNo} курс";
        worksheet.Cell("C5").Value = $"{sheet.AcademicYear} учебный год";
        worksheet.Cell("A7").Value = $"Группа: {sheet.GroupName}";
        worksheet.Cell("C7").Value = $"Дисциплина: {sheet.DisciplineName}";

        var teacherShortName = (sheet.TeacherShortName ?? string.Empty).Trim();

        worksheet.Cell("A8").Value = IsUnknownTeacher(teacherShortName)
            ? "Фамилия, имя, отчество преподавателя:"
            : $"Фамилия, имя, отчество преподавателя: {teacherShortName}";

        var orderedElements = sheet.Elements
            .OrderBy(element => element.OrderNo)
            .ThenBy(element => element.IdElement)
            .ToList();

        const int firstElementColumn = 3; // C
        const int lastElementColumn = 26; // Z
        const int accumulatedColumn = 27; // AA
        const int examColumn = 28; // AB
        const int finalColumn = 29; // AC
        const int headerRow = 14;
        const int firstStudentRow = 15;

        var exportElements = orderedElements
            .Take(lastElementColumn - firstElementColumn + 1)
            .ToList();

        for (var index = 0; index < exportElements.Count; index++)
        {
            var column = firstElementColumn + index;

            worksheet.Cell(headerRow, column).Value = exportElements[index].ElementName;
            worksheet.Cell(headerRow, column).Style.Alignment.WrapText = true;
            worksheet.Cell(headerRow, column).Style.Alignment.Horizontal =
                XLAlignmentHorizontalValues.Center;
            worksheet.Cell(headerRow, column).Style.Alignment.Vertical =
                XLAlignmentVerticalValues.Center;
        }

        worksheet.Cell(headerRow, accumulatedColumn).Value = "накоп";
        worksheet.Cell(headerRow, examColumn).Value = "экз";
        worksheet.Cell(headerRow, finalColumn).Value = "итог";

        for (var rowIndex = 0; rowIndex < sheet.Students.Count; rowIndex++)
        {
            var student = sheet.Students[rowIndex];
            var row = firstStudentRow + rowIndex;

            worksheet.Cell(row, 1).Value = rowIndex + 1;
            worksheet.Cell(row, 2).Value = student.FullName;

            for (var elementIndex = 0; elementIndex < exportElements.Count; elementIndex++)
            {
                var element = exportElements[elementIndex];
                var column = firstElementColumn + elementIndex;

                var grade = student.Grades
                    .FirstOrDefault(item => item.IdElement == element.IdElement)
                    ?.GradeValue;

                SetGradeCell(worksheet.Cell(row, column), grade);
            }

            SetGradeCell(worksheet.Cell(row, accumulatedColumn), student.AccumulatedGrade);
            SetGradeCell(worksheet.Cell(row, examColumn), student.ExamGrade);
            SetGradeCell(worksheet.Cell(row, finalColumn), student.FinalGrade);
        }

        var lastStudentRow = Math.Max(firstStudentRow, firstStudentRow + sheet.Students.Count - 1);

        var usedRange = worksheet.Range(
            firstStudentRow,
            1,
            lastStudentRow,
            finalColumn
        );

        usedRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        usedRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        usedRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;

        worksheet.Columns(1, finalColumn).AdjustToContents();
    }

    private static void SetGradeCell(IXLCell cell, decimal? value)
    {
        if (!value.HasValue)
        {
            cell.Value = string.Empty;
            return;
        }

        cell.Value = Math.Round(value.Value, 2);
    }

    private static bool IsUnknownTeacher(string? teacherShortName)
    {
        var normalized = (teacherShortName ?? string.Empty)
            .Trim()
            .ToLowerInvariant();

        return string.IsNullOrWhiteSpace(normalized)
            || normalized == "не указан н."
            || normalized == "не указан"
            || normalized.StartsWith("не указан");
    }

    private static string SanitizeFileName(string value)
    {
        var invalidChars = Path.GetInvalidFileNameChars();

        var sanitized = new string(
            value
                .Select(character => invalidChars.Contains(character) ? '-' : character)
                .ToArray()
        );

        return string.IsNullOrWhiteSpace(sanitized)
            ? "sheet"
            : sanitized.Trim();
    }

    private static string NormalizeGroupKey(SupabaseOfficeFinalSheetGroupRow row)
    {
        if (!string.IsNullOrWhiteSpace(row.GroupName))
        {
            return row.GroupName.Trim().ToLowerInvariant();
        }

        return $"id:{row.IdGroup}";
    }

    private static string NormalizeElementKey(SupabaseOfficeFinalSheetRow row)
    {
        var normalizedName = NormalizeKeyPart(row.ElementName);

        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            return normalizedName;
        }

        return row.IdElement.HasValue
            ? $"id:{row.IdElement.Value}"
            : "empty-element";
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

    private static decimal? GetFirstGradeValue(
        IEnumerable<SupabaseOfficeFinalSheetRow> rows,
        HashSet<int> elementIds
    )
    {
        return rows
            .Where(row => row.IdElement.HasValue && elementIds.Contains(row.IdElement.Value))
            .Select(row => row.GradeValue)
            .FirstOrDefault(value => value.HasValue);
    }

    private static string BuildFullName(string surname, string name, string? fathername)
    {
        return string.IsNullOrWhiteSpace(fathername)
            ? $"{surname} {name}"
            : $"{surname} {name} {fathername}";
    }

    private static decimal? CalculateAccumulatedGrade(
        List<OfficeFinalSheetStudentElementForCalc> elements
    )
    {
        var nonExamElements = elements
            .Where(item => !IsExamElement(item))
            .Where(item => item.GradeValue.HasValue)
            .ToList();

        return CalculateWeightedAverage(nonExamElements);
    }

    private static decimal? CalculateExamGrade(
        List<OfficeFinalSheetStudentElementForCalc> elements
    )
    {
        var examElement = elements.FirstOrDefault(IsExamElement);
        return examElement?.GradeValue;
    }

    private static decimal? CalculatePreliminaryFinalGrade(
        List<OfficeFinalSheetStudentElementForCalc> elements
    )
    {
        var filledElements = elements
            .Where(item => item.GradeValue.HasValue)
            .ToList();

        return CalculateWeightedAverage(filledElements);
    }

    private static decimal? CalculateWeightedAverage(
        List<OfficeFinalSheetStudentElementForCalc> elements
    )
    {
        if (elements.Count == 0)
        {
            return null;
        }

        var elementsWithWeight = elements
            .Where(item => item.Weight.HasValue && item.Weight.Value > 0)
            .ToList();

        if (elementsWithWeight.Count > 0)
        {
            var weightSum = elementsWithWeight.Sum(item => item.Weight!.Value);

            if (weightSum > 0)
            {
                var weightedSum = elementsWithWeight.Sum(
                    item => item.GradeValue!.Value * item.Weight!.Value
                );

                return Math.Round(weightedSum / weightSum, 2);
            }
        }

        var average = elements.Average(item => item.GradeValue!.Value);
        return Math.Round(average, 2);
    }

    private static bool IsExamElement(OfficeFinalSheetStudentElementForCalc element)
    {
        var name = element.ElementName.ToLowerInvariant();
        var type = element.ControlType?.ToLowerInvariant() ?? string.Empty;

        return name.Contains("экз")
            || name.Contains("экзамен")
            || type.Contains("exam")
            || type.Contains("экз")
            || type.Contains("экзамен");
    }

    private class OfficeFinalSheetElementGroupForCalc
    {
        public int IdElement { get; set; }

        public HashSet<int> ElementIds { get; set; } = new();

        public string ElementName { get; set; } = string.Empty;

        public string? ControlType { get; set; }

        public decimal? Weight { get; set; }

        public int OrderNo { get; set; }
    }

    private class OfficeFinalSheetStudentElementForCalc
    {
        public string ElementName { get; set; } = string.Empty;

        public string? ControlType { get; set; }

        public decimal? Weight { get; set; }

        public decimal? GradeValue { get; set; }
    }

    private class SupabaseOfficeFinalSheetGroupRow
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

        [JsonPropertyName("filled_final_grades_count")]
        public int FilledFinalGradesCount { get; set; }

        [JsonPropertyName("failed_students_count")]
        public int FailedStudentsCount { get; set; }
    }

    private class SupabaseOfficeFinalSheetRow
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
        public string? RecordBookNo { get; set; }

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

        [JsonPropertyName("formula_text")]
        public string? FormulaText { get; set; }
    }
}