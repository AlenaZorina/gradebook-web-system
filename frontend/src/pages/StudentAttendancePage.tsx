import { useEffect, useMemo, useState } from "react";
import type {
  LoginResponse,
  StudentAttendance,
  StudentDiscipline
} from "../api";
import {
  getStudentAttendance,
  getStudentDisciplines
} from "../api";
import "./TeacherSchedulePage.css";
import "./StudentAttendancePage.css";

type StudentAttendancePageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenGradebook: (disciplineId?: number, groupId?: number) => void;
  onOpenAnalytics: () => void;
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

function getStatusSymbol(status: StudentAttendance["sessions"][number]["status"]) {
  if (status === "present") {
    return "✓";
  }

  if (status === "absent") {
    return "×";
  }

  return "—";
}

function getStatusTitle(status: StudentAttendance["sessions"][number]["status"]) {
  if (status === "present") {
    return "Присутствие";
  }

  if (status === "absent") {
    return "Отсутствие";
  }

  return "Нет данных";
}

export function StudentAttendancePage({
  user,
  initialDisciplineId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenGradebook,
  onOpenAnalytics
}: StudentAttendancePageProps) {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialDisciplineId ?? null
  );

  const [attendance, setAttendance] = useState<StudentAttendance | null>(null);
  const [isDisciplinesLoading, setIsDisciplinesLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
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
    async function loadAttendance() {
      if (!selectedDisciplineId) {
        return;
      }

      try {
        setIsAttendanceLoading(true);
        setError("");

        const data = await getStudentAttendance(user.idUser, selectedDisciplineId);
        setAttendance(data);
      } catch (err) {
        setAttendance(null);
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки посещаемости"
        );
      } finally {
        setIsAttendanceLoading(false);
      }
    }

    loadAttendance();
  }, [user.idUser, selectedDisciplineId]);

  const selectedDiscipline = useMemo(
    () =>
      disciplines.find(
        (discipline) => discipline.idDiscipline === selectedDisciplineId
      ) ?? null,
    [disciplines, selectedDisciplineId]
  );

  const currentGroupName =
    attendance?.groupName ?? selectedDiscipline?.groupName ?? "Группа";

  const currentCourseNo =
    attendance?.courseNo ?? selectedDiscipline?.courseNo ?? null;

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

            <button className="nav-item active" type="button">
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() =>
                onOpenGradebook(attendance?.idDiscipline, attendance?.idGroup)
              }
            >
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

      <main className="student-attendance-content">
        <section className="student-attendance-hero">
          <div>
            <h1>
              {attendance?.disciplineName ??
                selectedDiscipline?.disciplineName ??
                "Посещаемость"}
            </h1>

            <div className="student-attendance-meta">
              {currentCourseNo && <strong>{currentCourseNo} курс</strong>}
              <span>{currentGroupName}</span>
            </div>
          </div>

          {disciplines.length > 1 && (
            <label className="student-attendance-select">
              <span>Дисциплина</span>
              <select
                value={selectedDisciplineId ?? ""}
                onChange={(event) =>
                  setSelectedDisciplineId(Number(event.target.value))
                }
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
          )}
        </section>

        {(isDisciplinesLoading || isAttendanceLoading) && (
          <div className="schedule-state">Загружаем посещаемость...</div>
        )}

        {error && !isAttendanceLoading && (
          <div className="schedule-error">{error}</div>
        )}

        {!isDisciplinesLoading && !isAttendanceLoading && !error && attendance && (
          <section className="student-attendance-panel">
            <div className="student-attendance-table-card">
              <div className="student-attendance-table-scroll">
                <table className="student-attendance-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      {attendance.sessions.map((session) => (
                        <th key={session.idSession}>{session.dateLabel}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>Статус</td>
                      {attendance.sessions.map((session) => (
                        <td key={session.idSession}>
                          <span
                            className={`student-attendance-status ${session.status}`}
                            title={getStatusTitle(session.status)}
                          >
                            {getStatusSymbol(session.status)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="student-attendance-summary">
              <span>% посещаемости</span>
              <strong>
                {attendance.attendancePercent === null
                  ? "—"
                  : attendance.attendancePercent}
              </strong>
            </aside>
          </section>
        )}

        {!isDisciplinesLoading &&
          !isAttendanceLoading &&
          !error &&
          attendance &&
          attendance.sessions.length === 0 && (
            <div className="schedule-state">
              По выбранной дисциплине пока нет занятий.
            </div>
          )}

        <button
          className="student-attendance-report-button"
          type="button"
          onClick={openReportModal}
        >
          Сообщить об ошибке
        </button>
      </main>

      {isReportOpen && (
        <div className="student-attendance-modal-overlay" onClick={closeReportModal}>
          <section
            className="student-attendance-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="student-attendance-modal-close"
              type="button"
              onClick={closeReportModal}
              aria-label="Закрыть"
            >
              ×
            </button>

            <h2>Нашли ошибку в разделе “Посещаемость”?</h2>
            <p>Опишите проблему, для более точного понимания</p>

            <label className="student-attendance-date-field">
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
              placeholder="Например: в этот день я был(а) на занятии, но стоит отсутствие"
              maxLength={500}
            />

            {reportMessage && (
              <div className="student-attendance-report-message">
                {reportMessage}
              </div>
            )}

            <div className="student-attendance-modal-actions">
              <button
                className="student-attendance-submit-button"
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