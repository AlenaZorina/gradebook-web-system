import { useEffect, useMemo, useState } from "react";
import type {
  AttendanceStudent,
  LoginResponse,
  TeacherAttendance,
  TeacherDiscipline
} from "../api";
import {
  getTeacherAttendance,
  getTeacherDisciplines
} from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherAttendancePage.css";

type TeacherAttendancePageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  initialGroupId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenGradebook: (disciplineId?: number, groupId?: number) => void;
};

export function TeacherAttendancePage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenGradebook
}: TeacherAttendancePageProps) {
  const [disciplines, setDisciplines] = useState<TeacherDiscipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialDisciplineId ?? null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    initialGroupId ?? null
  );

  const [attendance, setAttendance] = useState<TeacherAttendance | null>(null);
  const [draftStudents, setDraftStudents] = useState<AttendanceStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherDisciplines(user.idUser);
        setDisciplines(data);

        const firstDiscipline = data[0];

        if (!selectedDisciplineId && firstDiscipline) {
          setSelectedDisciplineId(firstDiscipline.idDiscipline);
        }

        if (!selectedGroupId && firstDiscipline) {
          setSelectedGroupId(firstDiscipline.idGroup);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
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
    async function loadAttendance() {
      if (!selectedDisciplineId || !selectedGroupId) {
        return;
      }

      try {
        setIsAttendanceLoading(true);
        setError("");
        setSaveMessage("");

        const data = await getTeacherAttendance(
          user.idUser,
          selectedDisciplineId,
          selectedGroupId
        );

        setAttendance(data);
        setDraftStudents(data.students);
      } catch (err) {
        setAttendance(null);
        setDraftStudents([]);
        setError(err instanceof Error ? err.message : "Ошибка загрузки посещаемости");
      } finally {
        setIsAttendanceLoading(false);
      }
    }

    loadAttendance();
  }, [user.idUser, selectedDisciplineId, selectedGroupId]);

  function toggleStatus(idStudent: number, idSession: number) {
    setDraftStudents((students) =>
      students.map((student) => {
        if (student.idStudent !== idStudent) {
          return student;
        }

        return {
          ...student,
          marks: student.marks.map((mark) => {
            if (mark.idSession !== idSession) {
              return mark;
            }

            return {
              ...mark,
              status: mark.status === "present" ? "absent" : "present"
            };
          })
        };
      })
    );
  }

  function handleCancel() {
    if (attendance) {
      setDraftStudents(attendance.students);
      setSaveMessage("");
    }
  }

  function handleSave() {
    setSaveMessage("Изменения сохранены локально. Запись в базу добавим следующим шагом.");
  }

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
            <span>Преподаватель кафедры ИТБ</span>
          </div>
        </div>

        <div className="sidebar-section-title">ОБЩЕЕ</div>

        <nav className="main-nav">
          <button className="nav-item" onClick={onOpenSchedule}>
            <span />
            Расписание
          </button>

          <button className="nav-item" onClick={onOpenDisciplines}>
            <span />
            Дисциплины
          </button>

          <button className="nav-item active">
            <span />
            Посещаемость
          </button>

          <button
            className="nav-item"
            onClick={() => onOpenGradebook(selectedDisciplineId ?? undefined, selectedGroupId ?? undefined)}
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

      <section className="attendance-content">
        <div className="attendance-topline">
          <div>
            <h1>{attendance?.disciplineName ?? "Посещаемость"}</h1>
            <p>
              {attendance ? `${attendance.courseNo} курс` : "Выберите дисциплину и группу"}
            </p>
          </div>

          <button className="export-button" type="button">
            Экспорт
          </button>
        </div>

        <div className="attendance-filters">
          <label>
            Дисциплина
            <select
              value={selectedDisciplineId ?? ""}
              onChange={(event) => {
                setSelectedDisciplineId(Number(event.target.value));
                setSelectedGroupId(null);
              }}
            >
              {uniqueDisciplines.map((discipline) => (
                <option key={discipline.idDiscipline} value={discipline.idDiscipline}>
                  {discipline.disciplineName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Группа
            <select
              value={selectedGroupId ?? ""}
              onChange={(event) => setSelectedGroupId(Number(event.target.value))}
            >
              {groupOptions.map((item) => (
                <option key={item.idGroup} value={item.idGroup}>
                  {item.groupName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading && <div className="attendance-state">Загружаем данные...</div>}

        {error && <div className="attendance-error">{error}</div>}

        {!isLoading && !error && isAttendanceLoading && (
          <div className="attendance-state">Загружаем посещаемость...</div>
        )}

        {!isLoading && !error && attendance && (
          <>
            <div className="attendance-title">Посещаемость</div>

            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    {attendance.sessions.map((session) => (
                      <th key={session.idSession}>{session.dateLabel}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {draftStudents.map((student) => (
                    <tr key={student.idStudent}>
                      <td>{student.fullName}</td>

                      {attendance.sessions.map((session) => {
                        const mark = student.marks.find(
                          (item) => item.idSession === session.idSession
                        );

                        const status = mark?.status ?? "unknown";

                        return (
                          <td key={session.idSession}>
                            <button
                              type="button"
                              className={`attendance-mark ${status}`}
                              onClick={() => toggleStatus(student.idStudent, session.idSession)}
                            >
                              {status === "present" ? "✓" : "×"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {saveMessage && <div className="attendance-save-message">{saveMessage}</div>}

            <div className="attendance-actions">
              <button className="secondary-button" type="button" onClick={handleCancel}>
                Отменить
              </button>

              <button className="primary-button" type="button" onClick={handleSave}>
                Сохранить
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}