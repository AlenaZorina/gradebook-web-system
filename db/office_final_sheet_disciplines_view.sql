CREATE OR REPLACE VIEW office_final_sheet_disciplines_view AS
WITH final_sheets AS (
    SELECT
        id_sheet,
        id_assignment,
        sheet_type,
        status,
        submitted_at,
        approved_at
    FROM grade_sheets
    WHERE sheet_type IN ('gradebook', 'final')
)
SELECT
    d.id_discipline,
    d.discipline_name,
    d.pud_url,

    p.id_program,
    p.program_name,

    e.id_enrollment,
    e.course_no,
    e.start_module_no,
    e.end_module_no,

    g.id_group,
    g.group_name,

    ta.id_assignment,
    ta.academic_year,

    fs.id_sheet,
    fs.sheet_type,
    fs.status AS sheet_status,
    fs.submitted_at,
    fs.approved_at,

    COUNT(DISTINCT s.id_student)::int AS students_count,

    COUNT(DISTINCT fg.id_final_grade)::int AS final_grades_count,

    COUNT(DISTINCT CASE
        WHEN fg.final_grade IS NOT NULL THEN s.id_student
        ELSE NULL
    END)::int AS filled_final_grades_count,

    COUNT(DISTINCT CASE
        WHEN fg.final_grade IS NOT NULL AND fg.final_grade < 4 THEN s.id_student
        ELSE NULL
    END)::int AS failed_students_count,

    COUNT(DISTINCT CASE
        WHEN fs.status = 'submitted' THEN fs.id_sheet
        ELSE NULL
    END)::int AS submitted_sheets_count,

    COUNT(DISTINCT CASE
        WHEN fs.status = 'approved' THEN fs.id_sheet
        ELSE NULL
    END)::int AS approved_sheets_count
FROM enrollments e
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN programs p ON p.id_program = e.id_program
LEFT JOIN groups g
    ON g.id_program = e.id_program
   AND g.course_no = e.course_no
   AND g.is_active = TRUE
LEFT JOIN teaching_assignments ta
    ON ta.id_enrollment = e.id_enrollment
   AND ta.id_group = g.id_group
   AND ta.is_active = TRUE
LEFT JOIN final_sheets fs
    ON fs.id_assignment = ta.id_assignment
LEFT JOIN students s
    ON s.id_group = g.id_group
LEFT JOIN final_grades fg
    ON fg.id_sheet = fs.id_sheet
   AND fg.id_student = s.id_student
GROUP BY
    d.id_discipline,
    d.discipline_name,
    d.pud_url,
    p.id_program,
    p.program_name,
    e.id_enrollment,
    e.course_no,
    e.start_module_no,
    e.end_module_no,
    g.id_group,
    g.group_name,
    ta.id_assignment,
    ta.academic_year,
    fs.id_sheet,
    fs.sheet_type,
    fs.status,
    fs.submitted_at,
    fs.approved_at;

NOTIFY pgrst, 'reload schema';