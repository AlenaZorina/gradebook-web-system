DROP VIEW IF EXISTS teacher_gradebook_view;

CREATE VIEW teacher_gradebook_view AS
SELECT
    gs.id_sheet,
    gs.status AS sheet_status,
    gs.submitted_at,
    gs.approved_at,

    teacher_user.id_user AS teacher_user_id,
    teacher_user.surname AS teacher_surname,
    teacher_user.name AS teacher_name,
    teacher_user.fathername AS teacher_fathername,

    ta.id_assignment,
    ta.academic_year,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    p.id_program,
    p.program_name,

    e.start_module_no,
    e.end_module_no,

    s.id_student,
    student_user.surname AS student_surname,
    student_user.name AS student_name,
    student_user.fathername AS student_fathername,
    s.record_book_no,

    ce.id_element,
    ce.element_name,
    ce.order_no AS element_order_no,
    ce.weight AS element_weight,

    gr.id_grade,
    gr.grade_value,

    fg.id_final_grade,
    fg.final_grade
FROM grade_sheets gs
JOIN teaching_assignments ta
    ON ta.id_assignment = gs.id_assignment
JOIN teachers t
    ON t.id_teacher = ta.id_teacher
JOIN users teacher_user
    ON teacher_user.id_user = t.id_user
JOIN enrollments e
    ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d
    ON d.id_discipline = e.id_discipline
JOIN groups g
    ON g.id_group = ta.id_group
JOIN programs p
    ON p.id_program = g.id_program
JOIN students s
    ON s.id_group = g.id_group
JOIN users student_user
    ON student_user.id_user = s.id_user
JOIN grading_formulas gf
    ON gf.id_assignment = ta.id_assignment
JOIN control_elements ce
    ON ce.id_formula = gf.id_formula
JOIN grades gr
    ON gr.id_sheet = gs.id_sheet
   AND gr.id_student = s.id_student
   AND gr.id_element = ce.id_element
JOIN final_grades fg
    ON fg.id_sheet = gs.id_sheet
   AND fg.id_student = s.id_student
WHERE gs.sheet_type = 'gradebook';

NOTIFY pgrst, 'reload schema';