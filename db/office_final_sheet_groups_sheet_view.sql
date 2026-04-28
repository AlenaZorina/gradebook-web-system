CREATE OR REPLACE VIEW office_final_sheet_groups_view AS
WITH selected_sheets AS (
    SELECT DISTINCT ON (id_assignment)
        id_sheet,
        id_assignment,
        sheet_type,
        status,
        submitted_at,
        approved_at
    FROM grade_sheets
    WHERE sheet_type IN ('gradebook', 'final')
    ORDER BY
        id_assignment,
        approved_at DESC NULLS LAST,
        submitted_at DESC NULLS LAST,
        id_sheet DESC
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

    ss.id_sheet,
    ss.sheet_type,
    ss.status AS sheet_status,
    ss.submitted_at,
    ss.approved_at,

    COUNT(DISTINCT s.id_student)::int AS students_count,

    COUNT(DISTINCT CASE
        WHEN fg.final_grade IS NOT NULL THEN s.id_student
        ELSE NULL
    END)::int AS filled_final_grades_count,

    COUNT(DISTINCT CASE
        WHEN fg.final_grade IS NOT NULL AND fg.final_grade < 4 THEN s.id_student
        ELSE NULL
    END)::int AS failed_students_count
FROM teaching_assignments ta
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN groups g ON g.id_group = ta.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN users teacher_user ON teacher_user.id_user = t.id_user
LEFT JOIN selected_sheets ss ON ss.id_assignment = ta.id_assignment
LEFT JOIN students s ON s.id_group = g.id_group
LEFT JOIN final_grades fg
    ON fg.id_sheet = ss.id_sheet
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
    ss.id_sheet,
    ss.sheet_type,
    ss.status,
    ss.submitted_at,
    ss.approved_at;


CREATE OR REPLACE VIEW office_final_sheet_rows_view AS
WITH selected_sheets AS (
    SELECT DISTINCT ON (id_assignment)
        id_sheet,
        id_assignment,
        sheet_type,
        status,
        submitted_at,
        approved_at
    FROM grade_sheets
    WHERE sheet_type IN ('gradebook', 'final')
    ORDER BY
        id_assignment,
        approved_at DESC NULLS LAST,
        submitted_at DESC NULLS LAST,
        id_sheet DESC
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

    ss.id_sheet,
    ss.sheet_type,
    ss.status AS sheet_status,

    gf.id_formula,
    gf.formula_text,

    ce.id_element,
    ce.element_name,
    ce.control_type,
    ce.weight,
    ce.order_no AS element_order_no,

    s.id_student,
    student_user.surname AS student_surname,
    student_user.name AS student_name,
    student_user.fathername AS student_fathername,
    s.record_book_no::text AS record_book_no,

    gr.id_grade,
    gr.grade_value,

    fg.id_final_grade,
    fg.final_grade
FROM teaching_assignments ta
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN groups g ON g.id_group = ta.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN users teacher_user ON teacher_user.id_user = t.id_user
JOIN students s ON s.id_group = g.id_group
JOIN users student_user ON student_user.id_user = s.id_user
LEFT JOIN selected_sheets ss ON ss.id_assignment = ta.id_assignment
LEFT JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
LEFT JOIN control_elements ce ON ce.id_formula = gf.id_formula
LEFT JOIN grades gr
    ON gr.id_sheet = ss.id_sheet
   AND gr.id_student = s.id_student
   AND gr.id_element = ce.id_element
LEFT JOIN final_grades fg
    ON fg.id_sheet = ss.id_sheet
   AND fg.id_student = s.id_student
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';