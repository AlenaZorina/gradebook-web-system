CREATE OR REPLACE VIEW office_resit_groups_view AS
WITH gradebook_sheets AS (
    SELECT
        id_sheet,
        id_assignment,
        sheet_type,
        status
    FROM grade_sheets
    WHERE sheet_type = 'gradebook'
)
SELECT
    d.id_discipline,
    d.discipline_name,
    d.pud_url,

    p.id_program,
    p.program_name,

    g.id_group,
    g.group_name,
    g.course_no,

    e.start_module_no,
    e.end_module_no,

    ta.id_assignment,
    ta.academic_year,

    teacher_user.surname || ' ' || LEFT(teacher_user.name, 1) || '.' ||
    CASE
        WHEN teacher_user.fathername IS NOT NULL
        THEN LEFT(teacher_user.fathername, 1) || '.'
        ELSE ''
    END AS teacher_short_name,

    gs.id_sheet,
    gs.status AS sheet_status,

    COUNT(DISTINCT s.id_student)::int AS students_count,

    COUNT(DISTINCT CASE
        WHEN fg.final_grade IS NOT NULL AND fg.final_grade < 4
        THEN s.id_student
        ELSE NULL
    END)::int AS retake_students_count
FROM teaching_assignments ta
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN groups g ON g.id_group = ta.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN users teacher_user ON teacher_user.id_user = t.id_user
LEFT JOIN gradebook_sheets gs ON gs.id_assignment = ta.id_assignment
LEFT JOIN students s ON s.id_group = g.id_group
LEFT JOIN final_grades fg
    ON fg.id_sheet = gs.id_sheet
   AND fg.id_student = s.id_student
WHERE ta.is_active = TRUE
GROUP BY
    d.id_discipline,
    d.discipline_name,
    d.pud_url,
    p.id_program,
    p.program_name,
    g.id_group,
    g.group_name,
    g.course_no,
    e.start_module_no,
    e.end_module_no,
    ta.id_assignment,
    ta.academic_year,
    teacher_user.surname,
    teacher_user.name,
    teacher_user.fathername,
    gs.id_sheet,
    gs.status;


CREATE OR REPLACE VIEW office_resit_students_view AS
WITH gradebook_sheets AS (
    SELECT
        id_sheet,
        id_assignment,
        sheet_type,
        status
    FROM grade_sheets
    WHERE sheet_type = 'gradebook'
)
SELECT
    d.id_discipline,
    d.discipline_name,
    d.pud_url,

    p.id_program,
    p.program_name,

    g.id_group,
    g.group_name,
    g.course_no,

    e.start_module_no,
    e.end_module_no,

    ta.id_assignment,
    ta.academic_year,

    teacher_user.surname || ' ' || LEFT(teacher_user.name, 1) || '.' ||
    CASE
        WHEN teacher_user.fathername IS NOT NULL
        THEN LEFT(teacher_user.fathername, 1) || '.'
        ELSE ''
    END AS teacher_short_name,

    gs.id_sheet,
    gs.status AS sheet_status,

    s.id_student,
    student_user.surname AS student_surname,
    student_user.name AS student_name,
    student_user.fathername AS student_fathername,
    s.record_book_no,

    fg.id_final_grade,
    fg.final_grade
FROM teaching_assignments ta
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN groups g ON g.id_group = ta.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN users teacher_user ON teacher_user.id_user = t.id_user
JOIN gradebook_sheets gs ON gs.id_assignment = ta.id_assignment
JOIN final_grades fg ON fg.id_sheet = gs.id_sheet
JOIN students s ON s.id_student = fg.id_student AND s.id_group = g.id_group
JOIN users student_user ON student_user.id_user = s.id_user
WHERE ta.is_active = TRUE
  AND fg.final_grade IS NOT NULL
  AND fg.final_grade < 4;

NOTIFY pgrst, 'reload schema';