import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, TeacherScheduleItem } from "../api";
import { getTeacherSchedule } from "../api";
import "./TeacherSchedulePage.css";

type TeacherSchedulePageProps = {
  user: LoginResponse;
  onLogout: () => void;
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

export function TeacherSchedulePage({ user, onLogout }: TeacherSchedulePageProps) {
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
      <span>
        {schedule[0]?.position && schedule[0]?.department
          ? `${schedule[0].position} ${schedule[0].department}`
          : "Преподаватель кафедры"}
      </span>
          </div>
        </div>

        <div className="sidebar-section-title">ОБЩЕЕ</div>

        <nav className="main-nav">
          <button className="nav-item active">
            <span />
            Расписание
          </button>

          <button className="nav-item">
            <span />
            Дисциплины
          </button>

          <button className="nav-item">
            <span />
            Посещаемость
          </button>

          <button className="nav-item">
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

      <section className="schedule-content">
        <h1>Расписание</h1>

        {isLoading && <div className="schedule-state">Загружаем расписание...</div>}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && weeks.length === 0 && (
          <div className="schedule-state">Расписание пока не найдено</div>
        )}

        {!isLoading && !error && weeks.map((week) => (
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
                        <div>
                          <strong>{item.disciplineName}</strong>
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