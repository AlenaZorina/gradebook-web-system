CREATE OR REPLACE VIEW office_bi_lesson_attendance_mart_view AS
SELECT
    ta.id_assignment,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    e.start_module_no,
    e.end_module_no,

    ats.id_session,
    ats.lesson_date,

    COUNT(DISTINCT s.id_student)::int AS total_students,

    COUNT(DISTINCT CASE
        WHEN a.status = 'present' THEN s.id_student
        ELSE NULL
    END)::int AS present_count,

    COUNT(DISTINCT CASE
        WHEN a.status = 'absent' THEN s.id_student
        ELSE NULL
    END)::int AS absent_count,

    CASE
        WHEN COUNT(DISTINCT s.id_student) = 0 THEN NULL
        ELSE ROUND(
            COUNT(DISTINCT CASE WHEN a.status = 'present' THEN s.id_student ELSE NULL END)::numeric
            / COUNT(DISTINCT s.id_student)::numeric * 100,
            1
        )
    END AS attendance_percent
FROM teaching_assignments ta
JOIN enrollments e
    ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d
    ON d.id_discipline = e.id_discipline
JOIN groups g
    ON g.id_group = ta.id_group
JOIN programs p
    ON p.id_program = g.id_program
LEFT JOIN students s
    ON s.id_group = g.id_group
LEFT JOIN attendance_sessions ats
    ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
WHERE ta.is_active = TRUE
GROUP BY
    ta.id_assignment,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    p.id_program,
    p.program_name,
    e.start_module_no,
    e.end_module_no,
    ats.id_session,
    ats.lesson_date;


CREATE OR REPLACE VIEW office_bi_student_attendance_mart_view AS
SELECT
    ta.id_assignment,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    e.start_module_no,
    e.end_module_no,

    s.id_student,
    student_user.surname || ' ' || LEFT(student_user.name, 1) || '.' ||
    CASE
        WHEN student_user.fathername IS NOT NULL
        THEN LEFT(student_user.fathername, 1) || '.'
        ELSE ''
    END AS student_full_name,

    COUNT(DISTINCT ats.id_session)::int AS total_lessons,

    COUNT(a.id_attendance) FILTER (
        WHERE a.status = 'present'
    )::int AS present_count,

    COUNT(a.id_attendance) FILTER (
        WHERE a.status = 'absent'
    )::int AS absent_count,

    CASE
        WHEN COUNT(DISTINCT ats.id_session) = 0 THEN NULL
        ELSE ROUND(
            COUNT(a.id_attendance) FILTER (WHERE a.status = 'present')::numeric
            / COUNT(DISTINCT ats.id_session)::numeric * 100,
            1
        )
    END AS attendance_percent
FROM teaching_assignments ta
JOIN enrollments e
    ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d
    ON d.id_discipline = e.id_discipline
JOIN groups g
    ON g.id_group = ta.id_group
JOIN programs p
    ON p.id_program = g.id_program
JOIN students s
    ON s.id_group = g.id_group
JOIN users student_user
    ON student_user.id_user = s.id_user
LEFT JOIN attendance_sessions ats
    ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
WHERE ta.is_active = TRUE
GROUP BY
    ta.id_assignment,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    p.id_program,
    p.program_name,
    e.start_module_no,
    e.end_module_no,
    s.id_student,
    student_user.surname,
    student_user.name,
    student_user.fathername;


CREATE OR REPLACE VIEW office_bi_student_performance_mart_view AS
WITH selected_sheets AS (
    SELECT DISTINCT ON (id_assignment)
        id_sheet,
        id_assignment,
        sheet_type,
        status
    FROM grade_sheets
    WHERE sheet_type IN ('gradebook', 'final')
    ORDER BY
        id_assignment,
        approved_at DESC NULLS LAST,
        submitted_at DESC NULLS LAST,
        id_sheet DESC
)
SELECT
    ta.id_assignment,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    e.start_module_no,
    e.end_module_no,

    ss.id_sheet,
    ss.sheet_type,
    ss.status AS sheet_status,

    s.id_student,
    student_user.surname || ' ' || LEFT(student_user.name, 1) || '.' ||
    CASE
        WHEN student_user.fathername IS NOT NULL
        THEN LEFT(student_user.fathername, 1) || '.'
        ELSE ''
    END AS student_full_name,

    COUNT(DISTINCT ce.id_element)::int AS total_control_grades,

    COUNT(DISTINCT gr.id_grade) FILTER (
        WHERE gr.grade_value IS NOT NULL
    )::int AS filled_control_grades,

    GREATEST(
        COUNT(DISTINCT ce.id_element)
        - COUNT(DISTINCT gr.id_grade) FILTER (WHERE gr.grade_value IS NOT NULL),
        0
    )::int AS missing_grades_count,

    ROUND(AVG(gr.grade_value), 2) AS average_control_grade,

    fg.final_grade
FROM teaching_assignments ta
JOIN enrollments e
    ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d
    ON d.id_discipline = e.id_discipline
JOIN groups g
    ON g.id_group = ta.id_group
JOIN programs p
    ON p.id_program = g.id_program
JOIN students s
    ON s.id_group = g.id_group
JOIN users student_user
    ON student_user.id_user = s.id_user
LEFT JOIN selected_sheets ss
    ON ss.id_assignment = ta.id_assignment
LEFT JOIN grading_formulas gf
    ON gf.id_assignment = ta.id_assignment
LEFT JOIN control_elements ce
    ON ce.id_formula = gf.id_formula
LEFT JOIN grades gr
    ON gr.id_sheet = ss.id_sheet
   AND gr.id_student = s.id_student
   AND gr.id_element = ce.id_element
LEFT JOIN final_grades fg
    ON fg.id_sheet = ss.id_sheet
   AND fg.id_student = s.id_student
WHERE ta.is_active = TRUE
GROUP BY
    ta.id_assignment,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    p.id_program,
    p.program_name,
    e.start_module_no,
    e.end_module_no,
    ss.id_sheet,
    ss.sheet_type,
    ss.status,
    s.id_student,
    student_user.surname,
    student_user.name,
    student_user.fathername,
    fg.final_grade;

NOTIFY pgrst, 'reload schema';