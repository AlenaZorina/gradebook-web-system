import { useEffect, useState } from "react";
import type { LoginResponse, StudentDisciplineDetails } from "../api";
import { getStudentDisciplineDetails } from "../api";
import "./TeacherSchedulePage.css";
import "./StudentDisciplineDetailsPage.css";

type StudentDisciplineDetailsPageProps = {
  user: LoginResponse;
  disciplineId: number;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: (disciplineId?: number, groupId?: number) => void;
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

function getModuleText(details: StudentDisciplineDetails) {
  if (
    details.startModuleNo &&
    details.endModuleNo &&
    details.startModuleNo !== details.endModuleNo
  ) {
    return `${details.startModuleNo}–${details.endModuleNo} модули`;
  }

  if (details.startModuleNo) {
    return `${details.startModuleNo} модуль`;
  }

  return "модуль не указан";
}

export function StudentDisciplineDetailsPage({
  user,
  disciplineId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: StudentDisciplineDetailsPageProps) {
  const [details, setDetails] = useState<StudentDisciplineDetails | null>(null);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getStudentDisciplineDetails(user.idUser, disciplineId);
        setDetails(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки информации о дисциплине"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDetails();
  }, [user.idUser, disciplineId]);

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
              <span>{details ? `Студент · ${details.groupName}` : "Студент"}</span>
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

            <button className="nav-item active" type="button" onClick={onOpenDisciplines}>
              <span className="nav-icon">
                <DisciplineIcon />
              </span>
              Дисциплины
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() =>
                onOpenAttendance(details?.idDiscipline, details?.idGroup)
              }
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenGradebook(details?.idDiscipline, details?.idGroup)}
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

      <main className="student-details-content">
        {isLoading && <div className="schedule-state">Загружаем дисциплину...</div>}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && details && (
          <>
            <button
              className="details-back-button"
              type="button"
              onClick={onOpenDisciplines}
            >
              ← Назад к дисциплинам
            </button>

            <section className="student-details-hero">
              <div>
                <h1>{details.disciplineName}</h1>

                <div className="student-details-meta">
                  <strong>{details.courseNo} курс</strong>
                  <span>{details.groupName}</span>
                  <span>{getModuleText(details)}</span>
                </div>
              </div>

              <div className="student-details-year">{details.academicYear}</div>
            </section>

            <section className="student-details-actions">
              <article className={`student-details-card ${isFormulaOpen ? "open" : ""}`}>
                <button
                  className="student-details-card-header"
                  type="button"
                  onClick={() => setIsFormulaOpen((value) => !value)}
                >
                  <span>
                    <h2>Формула оценивания</h2>

                    {details.pudUrl ? (
                      <a
                        href={details.pudUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ссылка на ПУД
                      </a>
                    ) : (
                      <span className="student-details-muted">Ссылка на ПУД</span>
                    )}
                  </span>

                  <span className="student-details-arrow">
                    {isFormulaOpen ? "⌃" : "⌄"}
                  </span>
                </button>

                {isFormulaOpen && (
                  <div className="student-formula-body">
                    <div className="student-formula-value">
                      {details.formulaText || "Формула пока не указана"}
                    </div>

                    <p>
                      Формула доступна только для просмотра. Редактирование выполняется
                      преподавателем.
                    </p>
                  </div>
                )}
              </article>

              <button
                className="student-details-card student-details-link-card"
                type="button"
                onClick={() => onOpenAttendance(details.idDiscipline, details.idGroup)}
              >
                <span>
                  <h2>Посещаемость</h2>
                  <p>Просмотреть посещаемость по дисциплине</p>
                </span>

                <span className="student-details-arrow">›</span>
              </button>

              <button
                className="student-details-card student-details-link-card"
                type="button"
                onClick={() => onOpenGradebook(details.idDiscipline, details.idGroup)}
              >
                <span>
                  <h2>Ведомость</h2>
                  <p>Просмотреть оценки и итоговый результат</p>
                </span>

                <span className="student-details-arrow">›</span>
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}