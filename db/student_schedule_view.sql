CREATE OR REPLACE VIEW student_schedule_view AS
SELECT
    st.id_user AS student_user_id,
    st.id_student,

    g.id_group,
    g.group_name,
    g.course_no,

    p.program_name,

    se.id_entry,
    se.lesson_date,
    se.start_time,
    se.end_time,
    se.week_no,
    se.module_no AS module_no,

    d.id_discipline,
    d.discipline_name,

    teacher_user.surname || ' ' || LEFT(teacher_user.name, 1) || '.' ||
        CASE
            WHEN teacher_user.fathername IS NOT NULL THEN LEFT(teacher_user.fathername, 1) || '.'
            ELSE ''
        END AS teacher_short_name,

    t.department,
    t.position
FROM students st
JOIN groups g ON st.id_group = g.id_group
JOIN programs p ON g.id_program = p.id_program
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
JOIN schedule_entries se ON se.id_assignment = ta.id_assignment
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN users teacher_user ON t.id_user = teacher_user.id_user
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';