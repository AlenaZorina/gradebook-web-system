CREATE OR REPLACE VIEW office_students_view AS
SELECT
    s.id_student,
    s.id_user,
    s.record_book_no::text AS record_book_no,

    student_user.surname AS student_surname,
    student_user.name AS student_name,
    student_user.fathername AS student_fathername,

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
JOIN groups g
    ON g.id_group = s.id_group
JOIN programs p
    ON p.id_program = g.id_program
LEFT JOIN student_statuses st
    ON st.id_status = s.id_status
ORDER BY
    student_user.surname ASC,
    student_user.name ASC,
    student_user.fathername ASC;

NOTIFY pgrst, 'reload schema';