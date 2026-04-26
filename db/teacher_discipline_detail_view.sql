CREATE OR REPLACE VIEW teacher_discipline_detail_view AS
SELECT
    ta.id_assignment,
    t.id_user AS teacher_user_id,
    d.id_discipline,
    d.discipline_name,
    d.pud_url,
    g.id_group,
    g.group_name,
    g.course_no,
    p.program_name,
    e.start_module_no,
    e.end_module_no,
    ta.academic_year,
    COALESCE(gf.formula_text, 'Формула пока не указана') AS formula_text
FROM teaching_assignments ta
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN programs p ON g.id_program = p.id_program
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
LEFT JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
WHERE ta.is_active = TRUE;

-- Чуть более похожая на макет тестовая формула для Чадова
UPDATE grading_formulas gf
SET formula_text = '0.5*кр + 0.4*экз + 0.1*аудит',
    updated_at = NOW()
FROM teaching_assignments ta
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN users u ON t.id_user = u.id_user
JOIN user_auth ua ON ua.id_user = u.id_user
WHERE gf.id_assignment = ta.id_assignment
  AND ua.login = 'chadov.al';

NOTIFY pgrst, 'reload schema';