CREATE OR REPLACE FUNCTION update_teacher_grading_formula(
    p_teacher_user_id integer,
    p_id_assignment integer,
    p_formula_text text,
    p_elements jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_formula integer;
    v_element jsonb;
    v_id_element integer;
    v_saved_element_id integer;
    v_keep_element_ids integer[] := ARRAY[]::integer[];
    v_order_no integer := 1;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM teaching_assignments ta
        JOIN teachers t
            ON t.id_teacher = ta.id_teacher
        WHERE ta.id_assignment = p_id_assignment
          AND t.id_user = p_teacher_user_id
    ) THEN
        RAISE EXCEPTION 'Назначение дисциплины не найдено или не принадлежит преподавателю';
    END IF;

    IF p_elements IS NULL
       OR jsonb_typeof(p_elements) <> 'array'
       OR jsonb_array_length(p_elements) = 0
    THEN
        RAISE EXCEPTION 'Формула должна содержать хотя бы один элемент контроля';
    END IF;

    SELECT id_formula
    INTO v_id_formula
    FROM grading_formulas
    WHERE id_assignment = p_id_assignment
    LIMIT 1;

    IF v_id_formula IS NULL THEN
        INSERT INTO grading_formulas (
            id_assignment,
            formula_text,
            updated_at
        )
        VALUES (
            p_id_assignment,
            p_formula_text,
            now()
        )
        RETURNING id_formula INTO v_id_formula;
    ELSE
        UPDATE grading_formulas
        SET
            formula_text = p_formula_text,
            updated_at = now()
        WHERE id_formula = v_id_formula;
    END IF;

    FOR v_element IN
        SELECT value
        FROM jsonb_array_elements(p_elements)
    LOOP
        IF NULLIF(TRIM(v_element ->> 'elementName'), '') IS NULL THEN
            RAISE EXCEPTION 'Название элемента контроля не может быть пустым';
        END IF;

        IF NULLIF(TRIM(v_element ->> 'weight'), '') IS NULL THEN
            RAISE EXCEPTION 'Вес элемента контроля не может быть пустым';
        END IF;

        IF (v_element ->> 'weight')::numeric <= 0 THEN
            RAISE EXCEPTION 'Вес элемента контроля должен быть больше 0';
        END IF;

        v_id_element := NULLIF(v_element ->> 'idElement', '')::integer;

        IF v_id_element IS NOT NULL
           AND EXISTS (
               SELECT 1
               FROM control_elements
               WHERE id_element = v_id_element
                 AND id_formula = v_id_formula
           )
        THEN
            UPDATE control_elements
            SET
                element_name = TRIM(v_element ->> 'elementName'),
                weight = (v_element ->> 'weight')::numeric,
                order_no = v_order_no,
                control_type = COALESCE(NULLIF(TRIM(v_element ->> 'controlType'), ''), 'custom')
            WHERE id_element = v_id_element
            RETURNING id_element INTO v_saved_element_id;
        ELSE
            INSERT INTO control_elements (
                id_formula,
                element_name,
                weight,
                order_no,
                control_type
            )
            VALUES (
                v_id_formula,
                TRIM(v_element ->> 'elementName'),
                (v_element ->> 'weight')::numeric,
                v_order_no,
                COALESCE(NULLIF(TRIM(v_element ->> 'controlType'), ''), 'custom')
            )
            RETURNING id_element INTO v_saved_element_id;
        END IF;

        v_keep_element_ids := array_append(v_keep_element_ids, v_saved_element_id);
        v_order_no := v_order_no + 1;
    END LOOP;

    -- Если элемент удалили из формулы, удаляем связанные оценки по нему,
    -- иначе FK может не дать удалить control_elements.
    DELETE FROM grades
    WHERE id_element IN (
        SELECT id_element
        FROM control_elements
        WHERE id_formula = v_id_formula
          AND NOT (id_element = ANY(v_keep_element_ids))
    );

    DELETE FROM control_elements
    WHERE id_formula = v_id_formula
      AND NOT (id_element = ANY(v_keep_element_ids));

    RETURN jsonb_build_object(
        'formulaText', p_formula_text,
        'elements', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'idElement', ce.id_element,
                    'elementName', ce.element_name,
                    'weight', ce.weight,
                    'orderNo', ce.order_no,
                    'controlType', ce.control_type
                )
                ORDER BY ce.order_no
            )
            FROM control_elements ce
            WHERE ce.id_formula = v_id_formula
        )
    );
END;
$$;

NOTIFY pgrst, 'reload schema';