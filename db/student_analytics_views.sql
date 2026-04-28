CREATE OR REPLACE VIEW student_bi_attendance_mart_view AS
SELECT
    s.id_user AS student_user_id,
    s.id_student,
    su.surname || ' ' || LEFT(su.name, 1) || '.' ||
    CASE
        WHEN su.fathername IS NOT NULL THEN LEFT(su.fathername, 1) || '.'
        ELSE ''
    END AS student_full_name,
    g.id_group,
    g.group_name,
    g.course_no,
    p.id_program,
    p.program_name,
    ta.id_assignment,
    ta.academic_year,
    d.id_discipline,
    d.discipline_name,
    ats.id_session,
    ats.lesson_date,
    ats.start_time,
    ats.end_time,
    COALESCE(a.status, 'unknown') AS attendance_status,
    CASE
        WHEN a.status = 'present' THEN 1
        WHEN a.status = 'absent' THEN 0
        ELSE NULL
    END AS attendance_value
FROM students s
JOIN users su ON su.id_user = s.id_user
JOIN groups g ON g.id_group = s.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN attendance_sessions ats ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
WHERE ta.is_active = TRUE;


CREATE OR REPLACE VIEW student_bi_grade_mart_view AS
WITH selected_sheets AS (
    SELECT DISTINCT ON (id_assignment)
        id_sheet,
        id_assignment,
        sheet_type,
        status,
        submitted_at,
        approved_at
    FROM grade_sheets
    WHERE sheet_type = 'gradebook'
    ORDER BY id_assignment, id_sheet DESC
)
SELECT
    s.id_user AS student_user_id,
    s.id_student,
    su.surname || ' ' || LEFT(su.name, 1) || '.' ||
    CASE
        WHEN su.fathername IS NOT NULL THEN LEFT(su.fathername, 1) || '.'
        ELSE ''
    END AS student_full_name,
    g.id_group,
    g.group_name,
    g.course_no,
    p.id_program,
    p.program_name,
    ta.id_assignment,
    ta.academic_year,
    d.id_discipline,
    d.discipline_name,
    gf.id_formula,
    gf.formula_text,
    gs.id_sheet,
    gs.status AS sheet_status,
    ce.id_element,
    ce.element_name,
    ce.control_type,
    ce.weight,
    ce.order_no AS element_order_no,
    gr.id_grade,
    gr.grade_value,
    fg.id_final_grade,
    fg.final_grade
FROM students s
JOIN users su ON su.id_user = s.id_user
JOIN groups g ON g.id_group = s.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
LEFT JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
LEFT JOIN control_elements ce ON ce.id_formula = gf.id_formula
LEFT JOIN selected_sheets gs ON gs.id_assignment = ta.id_assignment
LEFT JOIN grades gr
    ON gr.id_sheet = gs.id_sheet
   AND gr.id_student = s.id_student
   AND gr.id_element = ce.id_element
LEFT JOIN final_grades fg
    ON fg.id_sheet = gs.id_sheet
   AND fg.id_student = s.id_student
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';