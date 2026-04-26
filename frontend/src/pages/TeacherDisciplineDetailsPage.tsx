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
};

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
  onOpenGradebook
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
        <div className="user-block">
          <div className="avatar-placeholder" />
          <div>
            <p>
              {user.surname} {user.name[0]}.
              {user.fathername ? `${user.fathername[0]}.` : ""}
            </p>
            <span>Преподаватель кафедры</span>
          </div>
        </div>

        <div className="sidebar-section-title">ОБЩЕЕ</div>

        <nav className="main-nav">
          <button className="nav-item" onClick={onOpenSchedule}>
            <span />
            Расписание
          </button>

          <button className="nav-item active" onClick={onOpenDisciplines}>
            <span />
            Дисциплины
          </button>

          <button
            className="nav-item"
            onClick={() => onOpenAttendance(details?.idDiscipline, selectedGroup ?? undefined)}
          >
            <span />
            Посещаемость
          </button>

          <button
            className="nav-item"
            onClick={() => onOpenGradebook(details?.idDiscipline, selectedGroup ?? undefined)}
          >
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

      <section className="discipline-detail-content">
        {isLoading && <div className="discipline-detail-state">Загружаем дисциплину...</div>}

        {error && <div className="discipline-detail-error">{error}</div>}

        {!isLoading && !error && details && (
          <>
            <button className="back-link" onClick={onOpenDisciplines}>
              ← Назад к дисциплинам
            </button>

            <h1>{details.disciplineName}</h1>

            <p className="discipline-course">{getCourseText(details.courseNo)}</p>

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
              <section className={`detail-accordion ${isFormulaOpen ? "open" : ""}`}>
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
                className="detail-row action-row"
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
                className="detail-row action-row"
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