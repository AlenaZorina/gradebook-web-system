import { useEffect, useMemo, useState } from "react";
import type {
  GradebookStudent,
  LoginResponse,
  TeacherDiscipline,
  TeacherGradebook
} from "../api";
import {
  exportTeacherGradebook,
  getTeacherDisciplines,
  getTeacherGradebook,
  submitTeacherGradebook,
  updateTeacherGradebook
} from "../api";
import { TeacherSidebar } from "../components/TeacherSidebar";
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
  onOpenAnalytics: () => void;
  onBackToDiscipline?: () => void;
};

export function TeacherGradebookPage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenAnalytics,
  onBackToDiscipline
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
  const [isExporting, setIsExporting] = useState(false);

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

        const initialDiscipline =
          data.find((item) => item.idDiscipline === initialDisciplineId) ??
          data[0];

        if (!selectedDisciplineId && initialDiscipline) {
          setSelectedDisciplineId(initialDiscipline.idDiscipline);
        }

        const initialGroup =
          data.find(
            (item) =>
              item.idDiscipline === initialDiscipline?.idDiscipline &&
              item.idGroup === initialGroupId
          ) ??
          data.find(
            (item) => item.idDiscipline === initialDiscipline?.idDiscipline
          );

        if (!selectedGroupId && initialGroup) {
          setSelectedGroupId(initialGroup.idGroup);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки дисциплин"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return disciplines.filter(
      (item) => item.idDiscipline === selectedDisciplineId
    );
  }, [disciplines, selectedDisciplineId]);

  const selectedGroup = useMemo(() => {
    return groupOptions.find((item) => item.idGroup === selectedGroupId);
  }, [groupOptions, selectedGroupId]);

  useEffect(() => {
    if (groupOptions.length === 0) {
      return;
    }

    const groupExists = groupOptions.some(
      (item) => item.idGroup === selectedGroupId
    );

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
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки ведомости"
        );
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
  
    const normalized = Number(value.replace(",", "."));
  
    if (Number.isNaN(normalized)) {
      return null;
    }
  
    const rounded = Math.round(normalized);
  
    return Math.min(10, Math.max(0, rounded));
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

  

  function handleCancel() {
    if (!gradebook) {
      return;
    }

    setDraftStudents(gradebook.students);
    setSaveMessage("Изменения отменены.");
    setError("");
  }
  function calculatePreliminaryFinal(student: GradebookStudent): number | null {
    if (!gradebook) {
      return null;
    }
  
    let hasAnyGrade = false;
  
    const total = gradebook.elements.reduce((sum, element) => {
      const grade = student.grades.find(
        (item) => item.idElement === element.idElement
      );
  
      if (grade?.gradeValue === null || grade?.gradeValue === undefined) {
        return sum;
      }
  
      hasAnyGrade = true;
  
      return sum + grade.gradeValue * element.weight;
    }, 0);
  
    if (!hasAnyGrade) {
      return null;
    }
  
    return Math.round(total * 100) / 100;
  }
  
  function calculateRoundedFinal(student: GradebookStudent): number | null {
    const preliminaryFinal = calculatePreliminaryFinal(student);
  
    if (preliminaryFinal === null) {
      return null;
    }
  
    return Math.min(10, Math.max(0, Math.round(preliminaryFinal)));
  }
  
  function formatPreliminaryFinal(value: number | null): string {
    if (value === null) {
      return "—";
    }
  
    return value.toFixed(2).replace(".", ",");
  }

  function areAllFinalGradesFilled() {
    return (
      draftStudents.length > 0 &&
      draftStudents.every((student) => calculateRoundedFinal(student) !== null)
    );
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
          finalGrade: calculateRoundedFinal(student)
        }))
      };

      await updateTeacherGradebook(
        user.idUser,
        selectedDisciplineId,
        selectedGroupId,
        payload
      );

      const savedStudents = draftStudents.map((student) => ({
        ...student,
        finalGrade: calculateRoundedFinal(student)
      }));
      
      setDraftStudents(savedStudents);
      
      setGradebook({
        ...gradebook,
        students: savedStudents
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

  async function handleExport() {
    if (!gradebook || !selectedDisciplineId || !selectedGroupId) {
      return;
    }
  
    try {
      setIsExporting(true);
      setError("");
  
      const blob = await exportTeacherGradebook(
        user.idUser,
        selectedDisciplineId,
        selectedGroupId
      );
  
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
  
      link.href = url;
      link.download = `Рабочая ведомость_${gradebook.disciplineName}_${selectedGroup?.groupName ?? "group"}.xlsx`;
      link.click();
  
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка экспорта ведомости"
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="schedule-layout">
      <TeacherSidebar
        user={user}
        activePage="gradebook"
        onLogout={onLogout}
        onOpenSchedule={onOpenSchedule}
        onOpenDisciplines={onOpenDisciplines}
        onOpenAttendance={() =>
          onOpenAttendance(
            selectedDisciplineId ?? undefined,
            selectedGroupId ?? undefined
          )
        }
        onOpenGradebook={() => undefined}
        onOpenAnalytics={onOpenAnalytics}
      />

      <main className="gradebook-content">
        {onBackToDiscipline && selectedDisciplineId && (
          <button
            className="teacher-back-link"
            type="button"
            onClick={onBackToDiscipline}
          >
            ← Назад к дисциплине
          </button>
        )}

        <section className="gradebook-topline">
          <div>
            <h1>{gradebook?.disciplineName ?? "Ведомость"}</h1>

            <p>
              {gradebook
                ? `${gradebook.courseNo} курс${
                    selectedGroup?.groupName
                      ? ` · ${selectedGroup.groupName}`
                      : ""
                  }`
                : "Выберите дисциплину и группу"}
            </p>
          </div>

          <button
            className="export-button"
            type="button"
            onClick={handleExport}
            disabled={!gradebook || isExporting}
          >
            {isExporting ? "Экспортируем..." : "Экспорт"}
          </button>
        </section>

        <section className="gradebook-filters">
          <label className="gradebook-filter">
            <span>Дисциплина</span>

            <select
              value={selectedDisciplineId ?? ""}
              onChange={(event) => {
                setSelectedDisciplineId(Number(event.target.value));
                setSelectedGroupId(null);
              }}
              disabled={isLoading}
            >
              {uniqueDisciplines.map((discipline) => (
                <option
                  key={discipline.idDiscipline}
                  value={discipline.idDiscipline}
                >
                  {discipline.disciplineName}
                </option>
              ))}
            </select>
          </label>

          <label className="gradebook-filter">
            <span>Группа</span>

            <select
              value={selectedGroupId ?? ""}
              onChange={(event) => setSelectedGroupId(Number(event.target.value))}
              disabled={isLoading || groupOptions.length === 0}
            >
              {groupOptions.map((item) => (
                <option key={item.idGroup} value={item.idGroup}>
                  {item.groupName}
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading && <div className="gradebook-state">Загружаем данные...</div>}

        {error && <div className="gradebook-error">{error}</div>}

        {!isLoading && !error && isGradebookLoading && (
          <div className="gradebook-state">Загружаем ведомость...</div>
        )}

        {!isLoading && !error && gradebook && (
          <>
            <section className="gradebook-table-shell">
              <div className="gradebook-title">Ведомость</div>

              <div className="gradebook-table-wrapper">
                <table className="gradebook-table">
                  <thead>
                    <tr>
                      <th>ФИО</th>

                      {gradebook.elements.map((element) => (
                        <th key={element.idElement}>{element.elementName}</th>
                      ))}

                      <th className="gradebook-preliminary-header">предварительный итог</th>
                      <th>итог</th>
                    </tr>
                  </thead>

                  <tbody>
                  {draftStudents.map((student) => {
                    const preliminaryFinal = calculatePreliminaryFinal(student);
                    const roundedFinal = calculateRoundedFinal(student);

                    return (
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
                                min={0}
                                max={10}
                                step={1}
                                inputMode="numeric"
                                value={grade?.gradeValue ?? ""}
                                onChange={(event) =>
                                  grade &&
                                  updateGrade(
                                    student.idStudent,
                                    grade.idGrade,
                                    event.target.value
                                  )
                                }
                              />
                            </td>
                          );
                        })}

                        <td className="gradebook-preliminary-cell">
                          <span className="gradebook-preliminary-value">
                            {formatPreliminaryFinal(preliminaryFinal)}
                          </span>
                        </td>

                        <td>
                          <input
                            className="gradebook-input gradebook-final-input"
                            value={roundedFinal ?? ""}
                            readOnly
                          />
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </section>

            {saveMessage && (
              <div className="gradebook-save-message">{saveMessage}</div>
            )}

            <div className="gradebook-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Отменить
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </>
        )}

        {isSubmitModalOpen && (
          <div className="gradebook-modal-overlay">
            <div className="gradebook-modal">
              <h3>Утвердить итоговую ведомость</h3>
              <p>Ведомость будет отправлена УО для утверждения</p>

              <div className="gradebook-modal-actions">
                <button
                  className="primary-button"
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
          </div>
        )}
      </main>
    </div>
  );
}