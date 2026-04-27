import { useEffect, useState } from "react";
import type { LoginResponse, TeacherDisciplineDetail } from "../api";
import { getTeacherDisciplineDetails } from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherDisciplineDetailsPage.css";

type TeacherDisciplineDetailsPageProps = {
  user: LoginResponse;
  disciplineId: number;
  initialGroupId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: (disciplineId?: number, groupId?: number) => void;
  onOpenGradebook: (disciplineId?: number, groupId?: number) => void;
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
      <path d="M8 12.5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function getCourseText(courseNo: number) {
  return `${courseNo} курс`;
}

export function TeacherDisciplineDetailsPage({
  user,
  disciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: TeacherDisciplineDetailsPageProps) {
  const [details, setDetails] = useState<TeacherDisciplineDetail | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    initialGroupId ?? null
  );
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherDisciplineDetails(
          user.idUser,
          disciplineId,
          selectedGroupId
        );

        setDetails(data);

        if (selectedGroupId === null) {
          setSelectedGroupId(data.selectedGroupId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки деталей дисциплины");
      } finally {
        setIsLoading(false);
      }
    }

    loadDetails();
  }, [user.idUser, disciplineId, selectedGroupId]);

  const selectedGroup = selectedGroupId ?? details?.selectedGroupId;

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
              <span>Преподаватель кафедры</span>
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

            <button className="nav-item active" type="button" onClick={onOpenDisciplines}>
              <span className="nav-icon">
                <DisciplineIcon />
              </span>
              Дисциплины
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenAttendance(details?.idDiscipline, selectedGroup ?? undefined)}
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenGradebook(details?.idDiscipline, selectedGroup ?? undefined)}
            >
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

      <section className="discipline-detail-content">
        {isLoading && <div className="discipline-detail-state">Загружаем дисциплину...</div>}

        {error && <div className="discipline-detail-error">{error}</div>}

        {!isLoading && !error && details && (
          <>
            <button className="back-link" type="button" onClick={onOpenDisciplines}>
              ← Назад к дисциплинам
            </button>

            <header className="discipline-detail-header">
              <div>
                <h1>{details.disciplineName}</h1>
                <p>{getCourseText(details.courseNo)}</p>
              </div>

              <div className="discipline-detail-badge">
                {details.academicYear}
              </div>
            </header>

            <div className="group-select-row">
              <label htmlFor="group-select">Группа:</label>

              <select
                id="group-select"
                value={selectedGroup ?? details.selectedGroupId}
                onChange={(event) => setSelectedGroupId(Number(event.target.value))}
              >
                {details.groups.map((group) => (
                  <option key={group.idGroup} value={group.idGroup}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div className="discipline-actions">
              <section className={`detail-card detail-accordion ${isFormulaOpen ? "open" : ""}`}>
                <button
                  className="detail-row"
                  type="button"
                  onClick={() => setIsFormulaOpen((value) => !value)}
                >
                  <div>
                    <h2>Формула оценивания</h2>
                    {details.pudUrl ? (
                      <a href={details.pudUrl} target="_blank" rel="noreferrer">
                        Ссылка на ПУД
                      </a>
                    ) : (
                      <span>Ссылка на ПУД</span>
                    )}
                  </div>

                  <span className="detail-arrow">{isFormulaOpen ? "⌃" : "⌄"}</span>
                </button>

                {isFormulaOpen && (
                  <div className="formula-body">
                    <div className="formula-box">
                      <span>{details.formulaText}</span>
                      <button type="button" title="Редактирование формулы">
                        ✎
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <button
                className="detail-card detail-row action-row"
                type="button"
                onClick={() => onOpenAttendance(details.idDiscipline, selectedGroup ?? details.selectedGroupId)}
              >
                <div>
                  <h2>Посещаемость</h2>
                  <span>Отметить посещаемость студентов</span>
                </div>

                <span className="detail-arrow">›</span>
              </button>

              <button
                className="detail-card detail-row action-row"
                type="button"
                onClick={() => onOpenGradebook(details.idDiscipline, selectedGroup ?? details.selectedGroupId)}
              >
                <div>
                  <h2>Ведомость</h2>
                  <span>Ведомость по дисциплине</span>
                </div>

                <span className="detail-arrow">›</span>
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}