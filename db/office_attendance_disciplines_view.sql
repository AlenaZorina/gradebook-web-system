CREATE OR REPLACE VIEW office_attendance_disciplines_view AS
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
LEFT JOIN students s
    ON s.id_group = g.id_group
LEFT JOIN attendance_sessions ats
    ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
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
    ta.academic_year;

NOTIFY pgrst, 'reload schema';