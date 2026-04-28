CREATE OR REPLACE VIEW student_attendance_view AS
SELECT
    st.id_user AS student_user_id,
    st.id_student,
    st.record_book_no,
    su.surname AS student_surname,
    su.name AS student_name,
    su.fathername AS student_fathername,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    ta.id_assignment,
    ta.academic_year,

    d.id_discipline,
    d.discipline_name,
    d.pud_url,

    ats.id_session,
    ats.lesson_date,
    ats.start_time,
    ats.end_time,
    ats.source,

    COALESCE(a.status, 'unknown') AS status
FROM students st
JOIN users su ON su.id_user = st.id_user
JOIN groups g ON g.id_group = st.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN attendance_sessions ats ON ats.id_assignment = ta.id_assignment
LEFT JOIN attendance a
    ON a.id_session = ats.id_session
   AND a.id_student = st.id_student
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';