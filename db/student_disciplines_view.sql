CREATE OR REPLACE VIEW student_disciplines_view AS
SELECT
    st.id_user AS student_user_id,
    st.id_student,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    d.id_discipline,
    d.discipline_name,

    MIN(e.start_module_no) AS start_module_no,
    MAX(e.end_module_no) AS end_module_no,

    MAX(ta.academic_year) AS academic_year,

    COUNT(DISTINCT t.id_teacher)::int AS teachers_count,

    STRING_AGG(
        DISTINCT teacher_user.surname || ' ' || LEFT(teacher_user.name, 1) || '.' ||
        CASE
            WHEN teacher_user.fathername IS NOT NULL THEN LEFT(teacher_user.fathername, 1) || '.'
            ELSE ''
        END,
        ', '
    ) AS teachers_short_names
FROM students st
JOIN groups g ON st.id_group = g.id_group
JOIN programs p ON g.id_program = p.id_program
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN users teacher_user ON t.id_user = teacher_user.id_user
WHERE ta.is_active = TRUE
GROUP BY
    st.id_user,
    st.id_student,
    g.id_group,
    g.group_name,
    g.course_no,
    p.id_program,
    p.program_name,
    d.id_discipline,
    d.discipline_name;

NOTIFY pgrst, 'reload schema';