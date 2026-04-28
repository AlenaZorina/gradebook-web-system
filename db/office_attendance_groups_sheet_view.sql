CREATE OR REPLACE VIEW office_attendance_groups_view AS
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

    COUNT(DISTINCT s.id_student)::int AS students_count,
    COUNT(DISTINCT ats.id_session)::int AS sessions_count,

    COUNT(a.id_attendance) FILTER (
        WHERE a.status IN ('present', 'absent')
    )::int AS marked_attendance_count,

    COUNT(a.id_attendance) FILTER (
        WHERE a.status = 'present'
    )::int AS present_attendance_count,

    COUNT(a.id_attendance) FILTER (
        WHERE a.status = 'absent'
    )::int AS absent_attendance_count
FROM teaching_assignments ta
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN groups g ON g.id_group = ta.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN users teacher_user ON teacher_user.id_user = t.id_user
LEFT JOIN students s ON s.id_group = g.id_group
LEFT JOIN attendance_sessions ats ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
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
    teacher_user.fathername;


CREATE OR REPLACE VIEW office_attendance_sheet_view AS
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

    s.id_student,
    student_user.surname AS student_surname,
    student_user.name AS student_name,
    student_user.fathername AS student_fathername,
    s.record_book_no,

    ats.id_session,
    ats.lesson_date,
    ats.start_time,
    ats.end_time,

    COALESCE(a.status, 'unknown') AS attendance_status
FROM teaching_assignments ta
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN groups g ON g.id_group = ta.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN users teacher_user ON teacher_user.id_user = t.id_user
JOIN students s ON s.id_group = g.id_group
JOIN users student_user ON student_user.id_user = s.id_user
JOIN attendance_sessions ats ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';