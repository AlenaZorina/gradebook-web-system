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
    v_id_discipline integer;
    v_assignment record;

    v_id_formula integer;
    v_element jsonb;

    v_id_element integer;
    v_saved_element_id integer;
    v_keep_element_ids integer[];
    v_order_no integer;

    v_element_name text;
    v_weight numeric;
    v_control_type text;
BEGIN
    /*
      Проверяем, что выбранное назначение действительно принадлежит преподавателю,
      который пытается редактировать формулу.
      Через это назначение определяем дисциплину.
    */
    SELECT e.id_discipline
    INTO v_id_discipline
    FROM teaching_assignments ta
    JOIN teachers t
        ON t.id_teacher = ta.id_teacher
    JOIN enrollments e
        ON e.id_enrollment = ta.id_enrollment
    WHERE ta.id_assignment = p_id_assignment
      AND t.id_user = p_teacher_user_id
    LIMIT 1;

    IF v_id_discipline IS NULL THEN
        RAISE EXCEPTION 'Назначение дисциплины не найдено или не принадлежит преподавателю';
    END IF;

    IF p_elements IS NULL
       OR jsonb_typeof(p_elements) <> 'array'
       OR jsonb_array_length(p_elements) = 0
    THEN
        RAISE EXCEPTION 'Формула должна содержать хотя бы один элемент контроля';
    END IF;

    /*
      Обновляем формулу для всех назначений этой дисциплины.
      То есть если дисциплина ведётся у РИС-25-1, РИС-25-2, РИС-25-3,
      формула станет одинаковой у всех этих групп.
    */
    FOR v_assignment IN
        SELECT ta.id_assignment
        FROM teaching_assignments ta
        JOIN enrollments e
            ON e.id_enrollment = ta.id_enrollment
        WHERE e.id_discipline = v_id_discipline
    LOOP
        SELECT id_formula
        INTO v_id_formula
        FROM grading_formulas
        WHERE id_assignment = v_assignment.id_assignment
        LIMIT 1;

        IF v_id_formula IS NULL THEN
            INSERT INTO grading_formulas (
                id_assignment,
                formula_text,
                updated_at
            )
            VALUES (
                v_assignment.id_assignment,
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

        v_keep_element_ids := ARRAY[]::integer[];
        v_order_no := 1;

        FOR v_element IN
            SELECT value
            FROM jsonb_array_elements(p_elements)
        LOOP
            v_element_name := NULLIF(TRIM(v_element ->> 'elementName'), '');
            v_weight := NULLIF(TRIM(v_element ->> 'weight'), '')::numeric;
            v_control_type := COALESCE(NULLIF(TRIM(v_element ->> 'controlType'), ''), 'custom');

            IF v_element_name IS NULL THEN
                RAISE EXCEPTION 'Название элемента контроля не может быть пустым';
            END IF;

            IF v_weight IS NULL OR v_weight <= 0 THEN
                RAISE EXCEPTION 'Вес элемента контроля должен быть больше 0';
            END IF;

            v_id_element := NULLIF(v_element ->> 'idElement', '')::integer;
            v_saved_element_id := NULL;

            /*
              Для той группы, из которой редактировали формулу, idElement может реально существовать.
              Тогда обновляем его по id.
            */
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
                    element_name = v_element_name,
                    weight = v_weight,
                    order_no = v_order_no,
                    control_type = v_control_type
                WHERE id_element = v_id_element
                RETURNING id_element INTO v_saved_element_id;
            END IF;

            /*
              Для остальных групп idElement будет другим, поэтому обновляем элемент по позиции.
              Так формула синхронизируется по всем группам.
            */
            IF v_saved_element_id IS NULL THEN
                SELECT id_element
                INTO v_saved_element_id
                FROM control_elements
                WHERE id_formula = v_id_formula
                  AND order_no = v_order_no
                LIMIT 1;

                IF v_saved_element_id IS NOT NULL THEN
                    UPDATE control_elements
                    SET
                        element_name = v_element_name,
                        weight = v_weight,
                        order_no = v_order_no,
                        control_type = v_control_type
                    WHERE id_element = v_saved_element_id;
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
                        v_element_name,
                        v_weight,
                        v_order_no,
                        v_control_type
                    )
                    RETURNING id_element INTO v_saved_element_id;
                END IF;
            END IF;

            v_keep_element_ids := array_append(v_keep_element_ids, v_saved_element_id);
            v_order_no := v_order_no + 1;
        END LOOP;

        /*
          Если элемент удалили из формулы, удаляем оценки по этому элементу
          и сам элемент контроля. Это нужно из-за внешних ключей grades -> control_elements.
        */
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
    END LOOP;

    /*
      Возвращаем актуальную формулу для того assignment, с которого пользователь редактировал.
      На фронте она сразу обновит состояние.
    */
    SELECT id_formula
    INTO v_id_formula
    FROM grading_formulas
    WHERE id_assignment = p_id_assignment
    LIMIT 1;

    RETURN jsonb_build_object(
        'formulaText', p_formula_text,
        'elements', (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'idElement', ce.id_element,
                        'elementName', ce.element_name,
                        'weight', ce.weight,
                        'orderNo', ce.order_no,
                        'controlType', ce.control_type
                    )
                    ORDER BY ce.order_no
                ),
                '[]'::jsonb
            )
            FROM control_elements ce
            WHERE ce.id_formula = v_id_formula
        )
    );
END;
$$;

NOTIFY pgrst, 'reload schema';