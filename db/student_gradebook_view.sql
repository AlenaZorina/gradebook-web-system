CREATE OR REPLACE VIEW student_gradebook_view AS
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

    gf.id_formula,
    gf.formula_text,

    gs.id_sheet,
    gs.status AS sheet_status,

    ce.id_element,
    ce.element_name,
    ce.weight,
    ce.order_no AS element_order_no,
    ce.control_type,

    gr.id_grade,
    gr.grade_value,
    gr.comment,

    fg.id_final_grade,
    fg.final_grade
FROM students st
JOIN users su ON su.id_user = st.id_user
JOIN groups g ON g.id_group = st.id_group
JOIN programs p ON p.id_program = g.id_program
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline
LEFT JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
LEFT JOIN control_elements ce ON ce.id_formula = gf.id_formula
LEFT JOIN grade_sheets gs ON gs.id_assignment = ta.id_assignment
LEFT JOIN grades gr
    ON gr.id_sheet = gs.id_sheet
   AND gr.id_student = st.id_student
   AND gr.id_element = ce.id_element
LEFT JOIN final_grades fg
    ON fg.id_sheet = gs.id_sheet
   AND fg.id_student = st.id_student
WHERE ta.is_active = TRUE;

NOTIFY pgrst, 'reload schema';