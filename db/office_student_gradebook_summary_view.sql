CREATE OR REPLACE VIEW office_student_gradebook_summary_view AS
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
    s.id_student,

    d.id_discipline,
    d.discipline_name,
    d.pud_url,

    e.id_enrollment,
    e.course_no,
    e.start_module_no,
    e.end_module_no,

    g.id_group,
    g.group_name,

    p.id_program,
    p.program_name,

    ta.id_assignment,
    ta.academic_year,

    ss.id_sheet,
    ss.sheet_type,
    ss.status AS sheet_status,

    fg.id_final_grade,
    fg.final_grade
FROM students s
JOIN groups g
    ON g.id_group = s.id_group
JOIN programs p
    ON p.id_program = g.id_program
JOIN teaching_assignments ta
    ON ta.id_group = g.id_group
   AND ta.is_active = TRUE
JOIN enrollments e
    ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d
    ON d.id_discipline = e.id_discipline
LEFT JOIN selected_sheets ss
    ON ss.id_assignment = ta.id_assignment
LEFT JOIN final_grades fg
    ON fg.id_sheet = ss.id_sheet
   AND fg.id_student = s.id_student;

NOTIFY pgrst, 'reload schema';