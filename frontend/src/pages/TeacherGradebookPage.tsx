import { useEffect, useMemo, useState } from "react";
import type {
  GradebookStudent,
  LoginResponse,
  TeacherDiscipline,
  TeacherGradebook
} from "../api";
import {
  getTeacherDisciplines,
  getTeacherGradebook,
  submitTeacherGradebook,
  updateTeacherGradebook
} from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherGradebookPage.css";

type TeacherGradebookPageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  initialGroupId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: (disciplineId?: number, groupId?: number) => void;
};

export function TeacherGradebookPage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance
}: TeacherGradebookPageProps) {
  const [disciplines, setDisciplines] = useState<TeacherDiscipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialDisciplineId ?? null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    initialGroupId ?? null
  );

  const [gradebook, setGradebook] = useState<TeacherGradebook | null>(null);
  const [draftStudents, setDraftStudents] = useState<GradebookStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGradebookLoading, setIsGradebookLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherDisciplines(user.idUser);
        setDisciplines(data);

        const firstDiscipline = data[0];

        if (!selectedDisciplineId && firstDiscipline) {
          setSelectedDisciplineId(firstDiscipline.idDiscipline);
        }

        if (!selectedGroupId && firstDiscipline) {
          setSelectedGroupId(firstDiscipline.idGroup);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser]);

  const uniqueDisciplines = useMemo(() => {
    const map = new Map<number, TeacherDiscipline>();

    disciplines.forEach((item) => {
      if (!map.has(item.idDiscipline)) {
        map.set(item.idDiscipline, item);
      }
    });

    return Array.from(map.values());
  }, [disciplines]);

  const groupOptions = useMemo(() => {
    if (!selectedDisciplineId) {
      return [];
    }

    return disciplines.filter((item) => item.idDiscipline === selectedDisciplineId);
  }, [disciplines, selectedDisciplineId]);

  useEffect(() => {
    if (groupOptions.length === 0) {
      return;
    }

    const groupExists = groupOptions.some((item) => item.idGroup === selectedGroupId);

    if (!groupExists) {
      setSelectedGroupId(groupOptions[0].idGroup);
    }
  }, [groupOptions, selectedGroupId]);

  useEffect(() => {
    async function loadGradebook() {
      if (!selectedDisciplineId || !selectedGroupId) {
        return;
      }

      try {
        setIsGradebookLoading(true);
        setError("");
        setSaveMessage("");

        const data = await getTeacherGradebook(
          user.idUser,
          selectedDisciplineId,
          selectedGroupId
        );

        setGradebook(data);
        setDraftStudents(data.students);
      } catch (err) {
        setGradebook(null);
        setDraftStudents([]);
        setError(err instanceof Error ? err.message : "Ошибка загрузки ведомости");
      } finally {
        setIsGradebookLoading(false);
      }
    }

    loadGradebook();
  }, [user.idUser, selectedDisciplineId, selectedGroupId]);

  function parseGrade(value: string): number | null {
    if (value.trim() === "") {
      return null;
    }

    const normalized = Number(value);

    if (Number.isNaN(normalized)) {
      return null;
    }

    return Math.min(10, Math.max(0, normalized));
  }

  function updateGrade(idStudent: number, idGrade: number, value: string) {
    const gradeValue = parseGrade(value);

    setDraftStudents((students) =>
      students.map((student) => {
        if (student.idStudent !== idStudent) {
          return student;
        }

        return {
          ...student,
          grades: student.grades.map((grade) =>
            grade.idGrade === idGrade
              ? {
                  ...grade,
                  gradeValue
                }
              : grade
          )
        };
      })
    );
  }

  function updateFinalGrade(idStudent: number, value: string) {
    const finalGrade = parseGrade(value);

    setDraftStudents((students) =>
      students.map((student) =>
        student.idStudent === idStudent
          ? {
              ...student,
              finalGrade
            }
          : student
      )
    );
  }

  function handleCancel() {
    if (gradebook) {
      setDraftStudents(gradebook.students);
      setSaveMessage("");
      setError("");
    }
  }

  function areAllFinalGradesFilled() {
    return draftStudents.length > 0 && draftStudents.every((student) => student.finalGrade !== null);
  }

  async function handleSave() {
    if (!gradebook || !selectedDisciplineId || !selectedGroupId) {
      setError("Необходимо выбрать дисциплину и группу");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSaveMessage("");

      const payload = {
        idSheet: gradebook.idSheet,
        students: draftStudents.map((student) => ({
          idStudent: student.idStudent,
          grades: student.grades.map((grade) => ({
            idGrade: grade.idGrade,
            idElement: grade.idElement,
            gradeValue: grade.gradeValue
          })),
          idFinalGrade: student.idFinalGrade,
          finalGrade: student.finalGrade
        }))
      };

      await updateTeacherGradebook(
        user.idUser,
        selectedDisciplineId,
        selectedGroupId,
        payload
      );

      setGradebook({
        ...gradebook,
        students: draftStudents
      });

      setSaveMessage("Ведомость сохранена.");

      if (areAllFinalGradesFilled()) {
        setIsSubmitModalOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения ведомости");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitGradebook() {
    if (!gradebook || !selectedDisciplineId || !selectedGroupId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const result = await submitTeacherGradebook(
        user.idUser,
        gradebook.idSheet,
        selectedDisciplineId,
        selectedGroupId
      );

      setSaveMessage(result.message);
      setIsSubmitModalOpen(false);

      setGradebook({
        ...gradebook,
        sheetStatus: "submitted"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки ведомости");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="schedule-layout">
      <aside className="app-sidebar">
        <div className="user-block">
          <div className="avatar-placeholder" />
          <div>
            <p>
              {user.surname} {user.name[0]}.
              {user.fathername ? `${user.fathername[0]}.` : ""}
            </p>
            <span>Преподаватель кафедры ИТБ</span>
          </div>
        </div>

        <div className="sidebar-section-title">ОБЩЕЕ</div>

        <nav className="main-nav">
          <button className="nav-item" onClick={onOpenSchedule}>
            <span />
            Расписание
          </button>

          <button className="nav-item" onClick={onOpenDisciplines}>
            <span />
            Дисциплины
          </button>

          <button
            className="nav-item"
            onClick={() => onOpenAttendance(selectedDisciplineId ?? undefined, selectedGroupId ?? undefined)}
          >
            <span />
            Посещаемость
          </button>

          <button className="nav-item active">
            <span />
            Ведомость
          </button>
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-section-title">BI-КОНТУР</div>

        <button className="nav-item">
          <span />
          Модуль аналитики
        </button>

        <button className="logout-button" onClick={onLogout}>
          Выйти
        </button>
      </aside>

      <section className="gradebook-content">
        <div className="gradebook-topline">
          <div>
            <h1>{gradebook?.disciplineName ?? "Ведомость"}</h1>
            <p>
              {gradebook ? `${gradebook.courseNo} курс` : "Выберите дисциплину и группу"}
            </p>
          </div>

          <button className="gradebook-export-button" type="button">
            Экспорт
          </button>
        </div>

        <div className="gradebook-filters">
          <label>
            Дисциплина
            <select
              value={selectedDisciplineId ?? ""}
              onChange={(event) => {
                setSelectedDisciplineId(Number(event.target.value));
                setSelectedGroupId(null);
              }}
            >
              {uniqueDisciplines.map((discipline) => (
                <option key={discipline.idDiscipline} value={discipline.idDiscipline}>
                  {discipline.disciplineName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Группа
            <select
              value={selectedGroupId ?? ""}
              onChange={(event) => setSelectedGroupId(Number(event.target.value))}
            >
              {groupOptions.map((item) => (
                <option key={item.idGroup} value={item.idGroup}>
                  {item.groupName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading && <div className="gradebook-state">Загружаем данные...</div>}

        {error && <div className="gradebook-error">{error}</div>}

        {!isLoading && !error && isGradebookLoading && (
          <div className="gradebook-state">Загружаем ведомость...</div>
        )}

        {!isLoading && !error && gradebook && (
          <>
            <div className="gradebook-title">Ведомость</div>

            <div className="gradebook-table-wrapper">
              <table className="gradebook-table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    {gradebook.elements.map((element) => (
                      <th key={element.idElement}>{element.elementName}</th>
                    ))}
                    <th>итог</th>
                  </tr>
                </thead>

                <tbody>
                  {draftStudents.map((student) => (
                    <tr key={student.idStudent}>
                      <td>{student.fullName}</td>

                      {gradebook.elements.map((element) => {
                        const grade = student.grades.find(
                          (item) => item.idElement === element.idElement
                        );

                        return (
                          <td key={element.idElement}>
                            <input
                              className="gradebook-input"
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={grade?.gradeValue ?? ""}
                              onChange={(event) =>
                                grade && updateGrade(student.idStudent, grade.idGrade, event.target.value)
                              }
                            />
                          </td>
                        );
                      })}

                      <td>
                        <input
                          className="gradebook-input final"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={student.finalGrade ?? ""}
                          onChange={(event) => updateFinalGrade(student.idStudent, event.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {saveMessage && <div className="gradebook-save-message">{saveMessage}</div>}

            <div className="gradebook-actions">
              <button className="gradebook-secondary-button" type="button" onClick={handleCancel}>
                Отменить
              </button>

              <button
                className="gradebook-primary-button"
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </>
        )}
      </section>

      {isSubmitModalOpen && (
        <div className="gradebook-modal-backdrop">
          <div className="gradebook-modal">
            <h2>Утвердить итоговую ведомость</h2>
            <p>Ведомость будет отправлена УО для утверждения</p>

            <button
              className="gradebook-modal-submit"
              type="button"
              onClick={handleSubmitGradebook}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Отправляем..." : "Отправить"}
            </button>

            <button
              className="gradebook-modal-skip"
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Пропустить
            </button>
          </div>
        </div>
      )}
    </main>
  );
}