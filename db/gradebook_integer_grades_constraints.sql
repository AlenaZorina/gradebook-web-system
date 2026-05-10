UPDATE grades
SET grade_value = ROUND(grade_value, 0)
WHERE grade_value IS NOT NULL;

UPDATE final_grades
SET final_grade = ROUND(final_grade, 0)
WHERE final_grade IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_grades_value_integer_0_10'
    ) THEN
        ALTER TABLE grades
        ADD CONSTRAINT chk_grades_value_integer_0_10
        CHECK (
            grade_value IS NULL
            OR (
                grade_value >= 0
                AND grade_value <= 10
                AND grade_value = ROUND(grade_value, 0)
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_final_grades_value_integer_0_10'
    ) THEN
        ALTER TABLE final_grades
        ADD CONSTRAINT chk_final_grades_value_integer_0_10
        CHECK (
            final_grade IS NULL
            OR (
                final_grade >= 0
                AND final_grade <= 10
                AND final_grade = ROUND(final_grade, 0)
            )
        );
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';