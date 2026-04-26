CREATE OR REPLACE VIEW teacher_bi_lesson_attendance_mart_view AS
SELECT
    t.id_user AS teacher_user_id,
    ta.id_assignment,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    ats.id_session,
    ats.lesson_date,
    ats.start_time,
    ats.end_time,

    COUNT(a.id_attendance)::int AS total_students,
    COUNT(a.id_attendance) FILTER (WHERE a.status = 'present')::int AS present_count,
    COUNT(a.id_attendance) FILTER (WHERE a.status = 'absent')::int AS absent_count,

    CASE
        WHEN COUNT(a.id_attendance) = 0 THEN NULL
        ELSE ROUND(
            100.0 * COUNT(a.id_attendance) FILTER (WHERE a.status = 'present')
            / COUNT(a.id_attendance),
            2
        )
    END AS attendance_percent
FROM attendance_sessions ats
JOIN teaching_assignments ta ON ats.id_assignment = ta.id_assignment
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
LEFT JOIN attendance a ON a.id_session = ats.id_session
WHERE ta.is_active = TRUE
GROUP BY
    t.id_user,
    ta.id_assignment,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    ats.id_session,
    ats.lesson_date,
    ats.start_time,
    ats.end_time;


CREATE OR REPLACE VIEW teacher_bi_student_attendance_mart_view AS
SELECT
    t.id_user AS teacher_user_id,
    ta.id_assignment,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    s.id_student,
    su.surname || ' ' || LEFT(su.name, 1) || '.' ||
        CASE
            WHEN su.fathername IS NOT NULL THEN LEFT(su.fathername, 1) || '.'
            ELSE ''
        END AS student_full_name,
    s.record_book_no,

    COUNT(ats.id_session)::int AS total_lessons,
    COUNT(a.id_attendance) FILTER (WHERE a.status = 'present')::int AS present_count,
    COUNT(a.id_attendance) FILTER (WHERE a.status = 'absent')::int AS absent_count,

    CASE
        WHEN COUNT(ats.id_session) = 0 THEN NULL
        ELSE ROUND(
            100.0 * COUNT(a.id_attendance) FILTER (WHERE a.status = 'present')
            / COUNT(ats.id_session),
            2
        )
    END AS attendance_percent
FROM students s
JOIN users su ON s.id_user = su.id_user
JOIN teaching_assignments ta ON s.id_group = ta.id_group
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
JOIN attendance_sessions ats ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
WHERE ta.is_active = TRUE
GROUP BY
    t.id_user,
    ta.id_assignment,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    s.id_student,
    su.surname,
    su.name,
    su.fathername,
    s.record_book_no;


CREATE OR REPLACE VIEW teacher_bi_student_performance_mart_view AS
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
    t.id_user AS teacher_user_id,
    ta.id_assignment,

    gs.id_sheet,
    gs.status AS sheet_status,
    gs.submitted_at,
    gs.approved_at,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    s.id_student,
    su.surname || ' ' || LEFT(su.name, 1) || '.' ||
        CASE
            WHEN su.fathername IS NOT NULL THEN LEFT(su.fathername, 1) || '.'
            ELSE ''
        END AS student_full_name,
    s.record_book_no,

    COUNT(gr.id_grade)::int AS total_control_grades,
    COUNT(gr.grade_value)::int AS filled_control_grades,
    (COUNT(gr.id_grade) - COUNT(gr.grade_value))::int AS missing_grades_count,
    ROUND(AVG(gr.grade_value), 2) AS average_control_grade,

    fg.final_grade
FROM selected_sheets gs
JOIN teaching_assignments ta ON gs.id_assignment = ta.id_assignment
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
JOIN students s ON s.id_group = g.id_group
JOIN users su ON s.id_user = su.id_user
LEFT JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
LEFT JOIN control_elements ce ON ce.id_formula = gf.id_formula
LEFT JOIN grades gr
    ON gr.id_sheet = gs.id_sheet
   AND gr.id_student = s.id_student
   AND gr.id_element = ce.id_element
LEFT JOIN final_grades fg
    ON fg.id_sheet = gs.id_sheet
   AND fg.id_student = s.id_student
WHERE ta.is_active = TRUE
GROUP BY
    t.id_user,
    ta.id_assignment,
    gs.id_sheet,
    gs.status,
    gs.submitted_at,
    gs.approved_at,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    s.id_student,
    su.surname,
    su.name,
    su.fathername,
    s.record_book_no,
    fg.final_grade;

NOTIFY pgrst, 'reload schema';