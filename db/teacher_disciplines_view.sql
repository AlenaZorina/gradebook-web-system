CREATE OR REPLACE VIEW teacher_disciplines_view AS
SELECT
    ta.id_assignment,
    t.id_user AS teacher_user_id,
    ta.academic_year,
    d.id_discipline,
    d.discipline_name,
    d.pud_url,
    g.id_group,
    g.group_name,
    g.course_no,
    p.program_name,
    e.start_module_no,
    e.end_module_no
FROM teaching_assignments ta
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN programs p ON g.id_program = p.id_program
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';