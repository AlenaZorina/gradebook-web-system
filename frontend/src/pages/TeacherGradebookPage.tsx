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
  onOpenAnalytics: () => void;
};

function getTeacherInitials(user: LoginResponse) {
  const surnameInitial = user.surname?.trim()?.[0] ?? "";
  const nameInitial = user.name?.trim()?.[0] ?? "";

  return `${surnameInitial}${nameInitial}`.toUpperCase();
}

function getTeacherShortName(user: LoginResponse) {
  const nameInitial = user.name?.trim()?.[0] ? `${user.name.trim()[0]}.` : "";
  const fathernameInitial = user.fathername?.trim()?.[0]
    ? `${user.fathername.trim()[0]}.`
    : "";

  return `${user.surname} ${nameInitial}${fathernameInitial}`;
}

function ScheduleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 9.5H20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DisciplineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.5H17.5A2.5 2.5 0 0 1 20 7V18.5A1.5 1.5 0 0 1 18.5 20H6.5A2.5 2.5 0 0 1 4 17.5V7A2.5 2.5 0 0 1 6.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 13H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 12L10.4 14.4L16.2 8.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GradebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 16H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18.5V5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 18.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 5H8A3 3 0 0 0 5 8V16A3 3 0 0 0 8 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 8L18 12L14 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TeacherGradebookPage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenAnalytics
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

        const initialDiscipline =
          data.find((item) => item.idDiscipline === initialDisciplineId) ?? data[0];

        if (!selectedDisciplineId && initialDiscipline) {
          setSelectedDisciplineId(initialDiscipline.idDiscipline);
        }

        const initialGroup =
          data.find(
            (item) =>
              item.idDiscipline === initialDiscipline?.idDiscipline &&
              item.idGroup === initialGroupId
          ) ??
          data.find((item) => item.idDiscipline === initialDiscipline?.idDiscipline);

        if (!selectedGroupId && initialGroup) {
          setSelectedGroupId(initialGroup.idGroup);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
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

    return disciplines.filter((item) => item.idDiscipline === selectedDisciplineId);
  }, [disciplines, selectedDisciplineId]);

  const selectedGroup = useMemo(() => {
    return groupOptions.find((item) => item.idGroup === selectedGroupId);
  }, [groupOptions, selectedGroupId]);

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
      setSaveMessage("Изменения отменены.");
      setError("");
    }
  }

  function areAllFinalGradesFilled() {
    return (
      draftStudents.length > 0 &&
      draftStudents.every((student) => student.finalGrade !== null)
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

  function handleExport() {
    if (!gradebook) {
      return;
    }

    const header = [
      "ФИО",
      ...gradebook.elements.map((element) => element.elementName),
      "итог"
    ];

    const rows = draftStudents.map((student) => [
      student.fullName,
      ...gradebook.elements.map((element) => {
        const grade = student.grades.find((item) => item.idElement === element.idElement);
        return grade?.gradeValue ?? "";
      }),
      student.finalGrade ?? ""
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `gradebook-${selectedGroup?.groupName ?? "group"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getTeacherInitials(user)}
            </div>

            <div>
              <p>{getTeacherShortName(user)}</p>
              <span>Преподаватель кафедры ИТБ</span>
            </div>
          </div>

          <div className="sidebar-section-title">ОБЩЕЕ</div>

          <nav className="main-nav">
            <button className="nav-item" type="button" onClick={onOpenSchedule}>
              <span className="nav-icon">
                <ScheduleIcon />
              </span>
              Расписание
            </button>

            <button className="nav-item" type="button" onClick={onOpenDisciplines}>
              <span className="nav-icon">
                <DisciplineIcon />
              </span>
              Дисциплины
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() =>
                onOpenAttendance(
                  selectedDisciplineId ?? undefined,
                  selectedGroupId ?? undefined
                )
              }
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button className="nav-item active" type="button">
              <span className="nav-icon">
                <GradebookIcon />
              </span>
              Ведомость
            </button>
          </nav>

          <div className="sidebar-divider" />

          <div className="sidebar-section-title">BI-КОНТУР</div>

          <button className="nav-item" type="button" onClick={onOpenAnalytics}>
            <span className="nav-icon">
              <AnalyticsIcon />
            </span>
            Модуль аналитики
          </button>
        </div>

        <button className="logout-button" type="button" onClick={onLogout}>
          <span className="nav-icon">
            <LogoutIcon />
          </span>
          Выйти
        </button>
      </aside>

      <section className="gradebook-content">
        <header className="gradebook-topline">
          <div>
            <h1>{gradebook?.disciplineName ?? "Ведомость"}</h1>
            <p>
              {gradebook
                ? `${gradebook.courseNo} курс${
                    selectedGroup?.groupName ? ` · ${selectedGroup.groupName}` : ""
                  }`
                : "Выберите дисциплину и группу"}
            </p>
          </div>

          <button
            className="export-button"
            type="button"
            onClick={handleExport}
            disabled={!gradebook}
          >
            Экспорт
          </button>
        </header>

        <div className="gradebook-filters">
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
                <option key={discipline.idDiscipline} value={discipline.idDiscipline}>
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
        </div>

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

                        <td>
                          <input
                            className="gradebook-input gradebook-final-input"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={student.finalGrade ?? ""}
                            onChange={(event) =>
                              updateFinalGrade(student.idStudent, event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {saveMessage && <div className="gradebook-save-message">{saveMessage}</div>}

            <div className="gradebook-actions">
              <button className="secondary-button" type="button" onClick={handleCancel}>
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
      </section>

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
  );
}