import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, StudentScheduleItem } from "../api";
import { getStudentSchedule } from "../api";
import "./TeacherSchedulePage.css";
import "./StudentSchedulePage.css";

type StudentSchedulePageProps = {
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

function formatDateRange(items: StudentScheduleItem[]) {
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

function GradesIcon() {
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

export function StudentSchedulePage({
  user,
  onLogout,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: StudentSchedulePageProps) {
  const [schedule, setSchedule] = useState<StudentScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getStudentSchedule(user.idUser);
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
    const grouped = new Map<string, StudentScheduleItem[]>();
  
    schedule.forEach((item) => {
      const monday = new Date(item.lessonDate);
      const day = monday.getDay() === 0 ? 7 : monday.getDay();
      monday.setDate(monday.getDate() - day + 1);
  
      const weekKey = `${item.moduleNo ?? "-"}-${item.weekNo ?? "-"}-${monday
        .toISOString()
        .slice(0, 10)}`;
  
      if (!grouped.has(weekKey)) {
        grouped.set(weekKey, []);
      }
  
      grouped.get(weekKey)!.push(item);
    });
  
    const allWeeks = Array.from(grouped.entries()).map(([key, items]) => {
      const sortedItems = [...items].sort(
        (a, b) =>
          new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime()
      );
  
      const first = sortedItems[0];
  
      return {
        key,
        moduleNo: first.moduleNo,
        weekNo: first.weekNo,
        dateRange: formatDateRange(sortedItems),
        firstDate: first.lessonDate,
        items: sortedItems
      };
    });
  
    return allWeeks
      .sort(
        (a, b) =>
          new Date(b.firstDate).getTime() - new Date(a.firstDate).getTime()
      )
      .slice(0, 1);
  }, [schedule]);

  const studentInfo = schedule[0];

  return (
    <main className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getStudentInitials(user)}
            </div>

            <div>
              <p>{getStudentShortName(user)}</p>
              <span>
                {studentInfo ? `Студент · ${studentInfo.groupName}` : "Студент"}
              </span>
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
                <GradesIcon />
              </span>
              Оценки
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

      <section className="schedule-content student-schedule-content">
        <header className="student-schedule-header">
          <div>
            <h1>Расписание</h1>

            {studentInfo && (
              <p className="student-schedule-subtitle">
                {studentInfo.courseNo} курс · {studentInfo.groupName}
              </p>
            )}
          </div>

          {studentInfo && (
            <div className="student-program-card">
              <span>Образовательная программа</span>
              <strong>{studentInfo.programName}</strong>
            </div>
          )}
        </header>

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
                        <article className="lesson-card student-lesson-card" key={item.idEntry}>
                          <time>{item.startTime?.slice(0, 5)}</time>

                          <div className="lesson-card-content">
                            <strong title={item.disciplineName}>
                              {item.disciplineName}
                            </strong>

                            <p>{item.teacherShortName}</p>

                            {item.position && (
                              <span className="student-lesson-position">
                                {item.position}
                              </span>
                            )}
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