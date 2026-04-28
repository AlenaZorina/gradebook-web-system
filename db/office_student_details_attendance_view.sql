CREATE OR REPLACE VIEW office_student_details_view AS
SELECT
    s.id_student,
    s.id_user,
    s.record_book_no::text AS record_book_no,

    student_user.surname AS student_surname,
    student_user.name AS student_name,
    student_user.fathername AS student_fathername,

    auth.login AS email,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    st.id_status,
    st.status_name AS student_status
FROM students s
JOIN users student_user
    ON student_user.id_user = s.id_user
LEFT JOIN user_auth auth
    ON auth.id_user = s.id_user
JOIN groups g
    ON g.id_group = s.id_group
JOIN programs p
    ON p.id_program = g.id_program
LEFT JOIN student_statuses st
    ON st.id_status = s.id_status;


CREATE OR REPLACE VIEW office_student_attendance_summary_view AS
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
LEFT JOIN attendance_sessions ats
    ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = s.id_student
GROUP BY
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
    ta.academic_year;

NOTIFY pgrst, 'reload schema';