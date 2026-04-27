import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, TeacherScheduleItem } from "../api";
import { getTeacherSchedule } from "../api";
import "./TeacherSchedulePage.css";

type TeacherSchedulePageProps = {
  user: LoginResponse;
  onLogout: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: () => void;
  onOpenGradebook: () => void;
  onOpenAnalytics: () => void;
};

const days = [
  { key: 1, title: "П" },
  { key: 2, title: "ВТ" },
  { key: 3, title: "СР" },
  { key: 4, title: "ЧТ" },
  { key: 5, title: "ПТ" },
  { key: 6, title: "СБ" }
];

function getDayKey(date: string) {
  const day = new Date(date).getDay();
  return day === 0 ? 7 : day;
}

function formatDateRange(items: TeacherScheduleItem[]) {
  if (items.length === 0) return "";

  const dates = items
    .map((item) => new Date(item.lessonDate))
    .sort((a, b) => a.getTime() - b.getTime());

  const first = dates[0];
  const last = new Date(first);
  last.setDate(first.getDate() + 5);

  const format = (date: Date) =>
    date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

  return `с ${format(first)} по ${format(last)}`;
}

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

export function TeacherSchedulePage({
  user,
  onLogout,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: TeacherSchedulePageProps) {
  const [schedule, setSchedule] = useState<TeacherScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherSchedule(user.idUser);
        setSchedule(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки расписания");
      } finally {
        setIsLoading(false);
      }
    }

    loadSchedule();
  }, [user.idUser]);

  const weeks = useMemo(() => {
    const grouped = new Map<string, TeacherScheduleItem[]>();

    schedule.forEach((item) => {
      const key = `${item.moduleNo ?? "-"}-${item.weekNo ?? "-"}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(item);
    });

    return Array.from(grouped.entries()).map(([key, items]) => {
      const first = items[0];

      return {
        key,
        moduleNo: first.moduleNo,
        weekNo: first.weekNo,
        dateRange: formatDateRange(items),
        items
      };
    });
  }, [schedule]);

  const teacherPosition =
    schedule[0]?.position && schedule[0]?.department
      ? `${schedule[0].position} ${schedule[0].department}`
      : "Преподаватель кафедры";

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
              <span>{teacherPosition}</span>
            </div>
          </div>

          <div className="sidebar-section-title">ОБЩЕЕ</div>

          <nav className="main-nav">
            <button className="nav-item active" type="button">
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

            <button className="nav-item" type="button" onClick={onOpenAttendance}>
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button className="nav-item" type="button" onClick={onOpenGradebook}>
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

      <section className="schedule-content">
        <h1>Расписание</h1>

        {isLoading && <div className="schedule-state">Загружаем расписание...</div>}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && weeks.length === 0 && (
          <div className="schedule-state">Расписание пока не найдено</div>
        )}

        {!isLoading &&
          !error &&
          weeks.map((week) => (
            <section className="week-block" key={week.key}>
              <h2>
                Модуль {week.moduleNo ?? "—"} неделя {week.weekNo ?? "—"}{" "}
                <span>({week.dateRange})</span>
              </h2>

              <div className="days-header">
                {days.map((day) => (
                  <div key={day.key}>{day.title}</div>
                ))}
              </div>

              <div className="week-grid">
                {days.map((day) => {
                  const dayItems = week.items.filter(
                    (item) => getDayKey(item.lessonDate) === day.key
                  );

                  return (
                    <div className="day-column" key={day.key}>
                      {dayItems.length === 0 && <div className="empty-day" />}

                      {dayItems.map((item) => (
                        <article className="lesson-card" key={item.idEntry}>
                          <time>{item.startTime?.slice(0, 5)}</time>

                          <div className="lesson-card-content">
                            <strong title={item.disciplineName}>
                              {item.disciplineName}
                            </strong>
                            <p>{item.groupName}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
      </section>
    </main>
  );
}