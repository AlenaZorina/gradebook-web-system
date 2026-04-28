CREATE OR REPLACE VIEW office_resit_disciplines_view AS
WITH latest_grade_sheets AS (
    SELECT DISTINCT ON (id_assignment)
        id_sheet,
        id_assignment,
        sheet_type,
        status,
        submitted_at,
        approved_at
    FROM grade_sheets
    WHERE sheet_type IN ('gradebook', 'final', 'resit')
    ORDER BY id_assignment, id_sheet DESC
),
base AS (
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

        lgs.id_sheet,
        lgs.status AS sheet_status
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
    LEFT JOIN latest_grade_sheets lgs
        ON lgs.id_assignment = ta.id_assignment
)
SELECT
    b.id_discipline,
    b.discipline_name,
    b.pud_url,

    b.id_program,
    b.program_name,
    b.course_no,
    b.start_module_no,
    b.end_module_no,

    b.id_group,
    b.group_name,
    b.id_assignment,
    b.academic_year,
    b.id_sheet,
    b.sheet_status,

    COUNT(DISTINCT s.id_student)::int AS students_count,

    COUNT(DISTINCT CASE
        WHEN fg.final_grade IS NOT NULL AND fg.final_grade < 4 THEN s.id_student
        ELSE NULL
    END)::int AS retake_students_count
FROM base b
LEFT JOIN students s
    ON s.id_group = b.id_group
LEFT JOIN final_grades fg
    ON fg.id_sheet = b.id_sheet
   AND fg.id_student = s.id_student
GROUP BY
    b.id_discipline,
    b.discipline_name,
    b.pud_url,
    b.id_program,
    b.program_name,
    b.course_no,
    b.start_module_no,
    b.end_module_no,
    b.id_group,
    b.group_name,
    b.id_assignment,
    b.academic_year,
    b.id_sheet,
    b.sheet_status;

NOTIFY pgrst, 'reload schema';