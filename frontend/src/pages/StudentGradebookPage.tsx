import { useEffect, useMemo, useState } from "react";
import type {
  LoginResponse,
  StudentDiscipline,
  StudentGradebook
} from "../api";
import {
  getStudentDisciplines,
  getStudentGradebook
} from "../api";
import "./TeacherSchedulePage.css";
import "./StudentGradebookPage.css";

type StudentGradebookPageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: (disciplineId?: number, groupId?: number) => void;
  onOpenAnalytics: () => void;
  onBackToDiscipline?: () => void;
};

function getStudentInitials(user: LoginResponse) {
  const surnameInitial = user.surname?.trim()?.[0] ?? "";
  const nameInitial = user.name?.trim()?.[0] ?? "";

  return `${surnameInitial}${nameInitial}`.toUpperCase();
}

function getStudentShortName(user: LoginResponse) {
  const nameInitial = user.name?.trim()?.[0] ? `${user.name.trim()[0]}.` : "";
  const fathernameInitial = user.fathername?.trim()?.[0]
    ? `${user.fathername.trim()[0]}.`
    : "";

  return `${user.surname} ${nameInitial}${fathernameInitial}`;
}

function ScheduleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DisciplineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 4.5h10.5A1.5 1.5 0 0 1 18 6v13.5H7.5A2.5 2.5 0 0 1 5 17V6.5A2 2 0 0 1 7 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 8h7M8 11h7M8 14h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 12.5 10.5 15 16 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function GradesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8.5 9h7M8.5 12h7M8.5 15h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatGrade(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toFixed(2).replace(".", ",").replace(",00", "");
}

function getElementUniqueKey(element: StudentGradebook["elements"][number]) {
  return (element.elementName ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function StudentGradebookPage({
  user,
  initialDisciplineId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenAnalytics,
  onBackToDiscipline
}: StudentGradebookPageProps) {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialDisciplineId ?? null
  );

  const [gradebook, setGradebook] = useState<StudentGradebook | null>(null);

  const [isDisciplinesLoading, setIsDisciplinesLoading] = useState(true);
  const [isGradebookLoading, setIsGradebookLoading] = useState(false);
  const [error, setError] = useState("");

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsDisciplinesLoading(true);
        setError("");

        const data = await getStudentDisciplines(user.idUser);
        setDisciplines(data);

        if (!selectedDisciplineId && data.length > 0) {
          setSelectedDisciplineId(data[0].idDiscipline);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
      } finally {
        setIsDisciplinesLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser, selectedDisciplineId]);

  useEffect(() => {
    async function loadGradebook() {
      if (!selectedDisciplineId) {
        return;
      }

      try {
        setIsGradebookLoading(true);
        setError("");

        const data = await getStudentGradebook(user.idUser, selectedDisciplineId);
        setGradebook(data);
      } catch (err) {
        setGradebook(null);
        setError(err instanceof Error ? err.message : "Ошибка загрузки ведомости");
      } finally {
        setIsGradebookLoading(false);
      }
    }

    loadGradebook();
  }, [user.idUser, selectedDisciplineId]);

  const selectedDiscipline = useMemo(
    () =>
      disciplines.find(
        (discipline) => discipline.idDiscipline === selectedDisciplineId
      ) ?? null,
    [disciplines, selectedDisciplineId]
  );

  const visibleElements = useMemo(() => {
    if (!gradebook) {
      return [];
    }

    const map = new Map<string, StudentGradebook["elements"][number]>();

    [...gradebook.elements]
      .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0))
      .forEach((element) => {
        const key = getElementUniqueKey(element);

        if (!key) {
          return;
        }

        const existing = map.get(key);

        if (!existing) {
          map.set(key, element);
          return;
        }

        if (
          (existing.gradeValue === null || existing.gradeValue === undefined) &&
          element.gradeValue !== null &&
          element.gradeValue !== undefined
        ) {
          map.set(key, element);
        }
      });

    return Array.from(map.values()).sort(
      (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)
    );
  }, [gradebook]);

  const currentGroupName =
    gradebook?.groupName ?? selectedDiscipline?.groupName ?? "Группа";

  const currentCourseNo =
    gradebook?.courseNo ?? selectedDiscipline?.courseNo ?? null;

  function openReportModal() {
    setReportDate("");
    setReportText("");
    setReportMessage("");
    setIsReportOpen(true);
  }

  function closeReportModal() {
    setIsReportOpen(false);
    setReportDate("");
    setReportText("");
    setReportMessage("");
  }

  function submitReport() {
    setReportMessage(
      "Сообщение подготовлено. После подключения обработки заявок оно будет отправляться в учебный офис."
    );
  }

  return (
    <div className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getStudentInitials(user)}
            </div>

            <div>
              <p>{getStudentShortName(user)}</p>
              <span>Студент · {currentGroupName}</span>
            </div>
          </div>

          <p className="sidebar-section-title">Общее</p>

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
                onOpenAttendance(gradebook?.idDiscipline, gradebook?.idGroup)
              }
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button className="nav-item active" type="button">
              <span className="nav-icon">
                <GradesIcon />
              </span>
              Ведомость
            </button>
          </nav>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">BI-контур</p>

          <nav className="main-nav">
            <button className="nav-item" type="button" onClick={onOpenAnalytics}>
              <span className="nav-icon">
                <AnalyticsIcon />
              </span>
              Модуль аналитики
            </button>
          </nav>
        </div>

        <button className="logout-button" type="button" onClick={onLogout}>
          <span className="nav-icon">
            <LogoutIcon />
          </span>
          Выйти
        </button>
      </aside>

      <main className="student-gradebook-content">
        {onBackToDiscipline && selectedDisciplineId && (
          <button
            className="student-gradebook-back-link"
            type="button"
            onClick={onBackToDiscipline}
          >
            ← Назад к дисциплине
          </button>
        )}

        <section className="student-gradebook-hero">
          <div>
            <h1>
              {gradebook?.disciplineName ??
                selectedDiscipline?.disciplineName ??
                "Ведомость"}
            </h1>

            <div className="student-gradebook-meta">
              {currentCourseNo && <strong>{currentCourseNo} курс</strong>}
              <span>{currentGroupName}</span>
            </div>
          </div>
        </section>

        {disciplines.length > 1 && (
          <section className="student-gradebook-filters">
            <label className="student-gradebook-filter">
              <span>Дисциплина</span>

              <select
                value={selectedDisciplineId ?? ""}
                onChange={(event) =>
                  setSelectedDisciplineId(Number(event.target.value))
                }
                disabled={isDisciplinesLoading}
              >
                {disciplines.map((discipline) => (
                  <option
                    key={`${discipline.idDiscipline}-${discipline.idGroup}`}
                    value={discipline.idDiscipline}
                  >
                    {discipline.disciplineName}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}

        <button
          className="student-gradebook-report-button"
          type="button"
          onClick={openReportModal}
        >
          Сообщить об ошибке
        </button>

        {(isDisciplinesLoading || isGradebookLoading) && (
          <div className="schedule-state">Загружаем ведомость...</div>
        )}

        {error && !isGradebookLoading && (
          <div className="schedule-error">{error}</div>
        )}

        {!isDisciplinesLoading && !isGradebookLoading && !error && gradebook && (
          <section className="student-gradebook-panel">
            <div className="student-gradebook-table-card">
              <div className="student-gradebook-table-header">
                <div>
                  <h2>Ведомость</h2>
                  <p>Оценки по элементам контроля</p>
                </div>
              </div>

              <div className="student-gradebook-table-scroll">
                <table className="student-gradebook-table">
                  <thead>
                    <tr>
                      <th></th>

                      {visibleElements.map((element) => (
                        <th key={`header-${element.idElement}-${element.elementName}`}>
                          {element.elementName}
                        </th>
                      ))}

                      <th>Итог</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Дата</td>

                      {visibleElements.map((element) => (
                        <td key={`date-${element.idElement}-${element.elementName}`}>
                          {element.dateLabel || "—"}
                        </td>
                      ))}

                      <td>—</td>
                    </tr>

                    <tr>
                      <td>Оценка</td>

                      {visibleElements.map((element) => (
                        <td key={`grade-${element.idElement}-${element.elementName}`}>
                          <span
                            className={`student-grade-value ${
                              element.gradeValue === null ||
                              element.gradeValue === undefined
                                ? "empty"
                                : ""
                            }`}
                          >
                            {formatGrade(element.gradeValue)}
                          </span>
                        </td>
                      ))}

                      <td>
                        <span
                          className={`student-grade-value ${
                            gradebook.finalGrade === null ||
                            gradebook.finalGrade === undefined
                              ? "empty"
                              : ""
                          }`}
                        >
                          {formatGrade(gradebook.finalGrade)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="student-gradebook-summary">
              <div className="student-gradebook-summary-item">
                <span>Накопленная оценка</span>
                <strong>{formatGrade(gradebook.accumulatedGrade)}</strong>
              </div>

              <div className="student-gradebook-summary-item">
                <span>Экзамен</span>
                <strong>{formatGrade(gradebook.examGrade)}</strong>
              </div>

              <div className="student-gradebook-summary-item">
                <span>Итог предварительно</span>
                <strong>{formatGrade(gradebook.preliminaryFinalGrade)}</strong>
              </div>

              <div className="student-gradebook-summary-item final">
                <span>Итог</span>
                <strong>{formatGrade(gradebook.finalGrade)}</strong>
              </div>
            </aside>
          </section>
        )}

        {!isDisciplinesLoading &&
          !isGradebookLoading &&
          !error &&
          gradebook &&
          visibleElements.length === 0 && (
            <div className="schedule-state">
              По выбранной дисциплине пока нет элементов контроля.
            </div>
          )}
      </main>

      {isReportOpen && (
        <div className="student-gradebook-modal-overlay" onClick={closeReportModal}>
          <section
            className="student-gradebook-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="student-gradebook-modal-close"
              type="button"
              onClick={closeReportModal}
              aria-label="Закрыть"
            >
              ×
            </button>

            <h2>Нашли ошибку в разделе “Ведомость”?</h2>
            <p>Опишите проблему, для более точного понимания</p>

            <label className="student-gradebook-date-field">
              <span>Выбрать день</span>

              <div>
                <CalendarIcon />

                <input
                  type="date"
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                />
              </div>
            </label>

            <textarea
              value={reportText}
              onChange={(event) => setReportText(event.target.value)}
              placeholder="Например: оценка за контрольную работу отображается неверно"
              maxLength={500}
            />

            {reportMessage && (
              <div className="student-gradebook-report-message">
                {reportMessage}
              </div>
            )}

            <div className="student-gradebook-modal-actions">
              <button
                className="student-gradebook-submit-button"
                type="button"
                onClick={submitReport}
              >
                Отправить
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}