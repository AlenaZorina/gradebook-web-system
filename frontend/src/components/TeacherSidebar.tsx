import type { LoginResponse } from "../api";
import {
  getTeacherInitials,
  getTeacherShortName,
  getTeacherSubtitle
} from "../utils/teacherProfile";

type TeacherSidebarPage =
  | "schedule"
  | "disciplines"
  | "attendance"
  | "gradebook"
  | "analytics";

type TeacherSidebarProps = {
  user: LoginResponse;
  activePage: TeacherSidebarPage;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: () => void;
  onOpenGradebook: () => void;
  onOpenAnalytics: () => void;
};

function ScheduleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 3.5V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
      <path
        d="M8 9H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 13H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 9H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 12.5H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 16H12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 18.5V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5V5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 18.5V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 19H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
      <path
        d="M18 12H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TeacherSidebar({
  user,
  activePage,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: TeacherSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-main">
        <div className="user-block">
          <div className="avatar-placeholder avatar-initials">
            {getTeacherInitials(user)}
          </div>

          <div>
            <p>{getTeacherShortName(user)}</p>
            <span>{getTeacherSubtitle(user)}</span>
          </div>
        </div>

        <p className="sidebar-section-title">ОБЩЕЕ</p>

        <nav className="main-nav">
          <button
            className={`nav-item ${activePage === "schedule" ? "active" : ""}`}
            type="button"
            onClick={onOpenSchedule}
          >
            <span className="nav-icon">
              <ScheduleIcon />
            </span>
            Расписание
          </button>

          <button
            className={`nav-item ${activePage === "disciplines" ? "active" : ""}`}
            type="button"
            onClick={onOpenDisciplines}
          >
            <span className="nav-icon">
              <DisciplineIcon />
            </span>
            Дисциплины
          </button>

          <button
            className={`nav-item ${activePage === "attendance" ? "active" : ""}`}
            type="button"
            onClick={onOpenAttendance}
          >
            <span className="nav-icon">
              <AttendanceIcon />
            </span>
            Посещаемость
          </button>

          <button
            className={`nav-item ${activePage === "gradebook" ? "active" : ""}`}
            type="button"
            onClick={onOpenGradebook}
          >
            <span className="nav-icon">
              <GradebookIcon />
            </span>
            Ведомость
          </button>
        </nav>

        <div className="sidebar-divider" />

        <p className="sidebar-section-title">BI-КОНТУР</p>

        <nav className="main-nav">
          <button
            className={`nav-item ${activePage === "analytics" ? "active" : ""}`}
            type="button"
            onClick={onOpenAnalytics}
          >
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
  );
}