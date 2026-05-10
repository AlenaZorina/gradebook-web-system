import { useEffect, useMemo, useState } from "react";
import type {
  AttendanceStudent,
  LoginResponse,
  TeacherAttendance,
  TeacherDiscipline
} from "../api";
import {
  getTeacherAttendance,
  getTeacherDisciplines,
  updateTeacherAttendance
} from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherAttendancePage.css";
import {
  getTeacherInitials,
  getTeacherShortName,
  getTeacherSubtitle
} from "../utils/teacherProfile";

type TeacherAttendancePageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  initialGroupId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenGradebook: (disciplineId?: number, groupId?: number) => void;
  onOpenAnalytics: () => void;
  onBackToDiscipline?: () => void;
};

function NavIcon({ label }: { label: string }) {
  return <span className="nav-icon">{label}</span>;
}

export function TeacherAttendancePage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenGradebook,
  onOpenAnalytics,
  onBackToDiscipline
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherDisciplines(user.idUser);
        setDisciplines(data);

        const initialDiscipline =
          data.find((item) => item.idDiscipline === initialDisciplineId) ??
          data[0];

        if (!selectedDisciplineId && initialDiscipline) {
          setSelectedDisciplineId(initialDiscipline.idDiscipline);
        }

        const initialGroup =
          data.find(
            (item) =>
              item.idDiscipline === initialDiscipline?.idDiscipline &&
              item.idGroup === initialGroupId
          ) ??
          data.find(
            (item) => item.idDiscipline === initialDiscipline?.idDiscipline
          );

        if (!selectedGroupId && initialGroup) {
          setSelectedGroupId(initialGroup.idGroup);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return disciplines.filter(
      (item) => item.idDiscipline === selectedDisciplineId
    );
  }, [disciplines, selectedDisciplineId]);

  useEffect(() => {
    if (groupOptions.length === 0) {
      return;
    }

    const groupExists = groupOptions.some(
      (item) => item.idGroup === selectedGroupId
    );

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
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки посещаемости"
        );
      } finally {
        setIsAttendanceLoading(false);
      }
    }

    loadAttendance();
  }, [user.idUser, selectedDisciplineId, selectedGroupId]);

  function toggleStatus(idStudent: number, idSession: number) {
    setSaveMessage("");

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
      setSaveMessage("Изменения отменены.");
    }
  }

  async function handleSave() {
    if (!selectedDisciplineId || !selectedGroupId) {
      setError("Необходимо выбрать дисциплину и группу");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSaveMessage("");

      const payload = {
        students: draftStudents.map((student) => ({
          idStudent: student.idStudent,
          marks: student.marks.map((mark) => ({
            idSession: mark.idSession,
            status: mark.status
          }))
        }))
      };

      await updateTeacherAttendance(
        user.idUser,
        selectedDisciplineId,
        selectedGroupId,
        payload
      );

      if (attendance) {
        setAttendance({
          ...attendance,
          students: draftStudents
        });
      }

      setSaveMessage("Изменения сохранены в базе.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения посещаемости");
    } finally {
      setIsSaving(false);
    }
  }

  function handleExport() {
    if (!attendance) {
      return;
    }

    const header = ["ФИО", ...attendance.sessions.map((session) => session.dateLabel)];

    const rows = draftStudents.map((student) => [
      student.fullName,
      ...attendance.sessions.map((session) => {
        const mark = student.marks.find(
          (item) => item.idSession === session.idSession
        );

        return mark?.status === "present" ? "присутствовал" : "отсутствовал";
      })
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `attendance-${attendance.groupName}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  const presentCount = useMemo(() => {
    return draftStudents.reduce((total, student) => {
      return total + student.marks.filter((mark) => mark.status === "present").length;
    }, 0);
  }, [draftStudents]);

  const totalMarks = useMemo(() => {
    if (!attendance) {
      return 0;
    }

    return draftStudents.length * attendance.sessions.length;
  }, [attendance, draftStudents.length]);

  return (
    <div className="schedule-layout">
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
            <button className="nav-item" type="button" onClick={onOpenSchedule}>
              <NavIcon label="📅" />
              Расписание
            </button>

            <button className="nav-item" type="button" onClick={onOpenDisciplines}>
              <NavIcon label="▤" />
              Дисциплины
            </button>

            <button className="nav-item active" type="button">
              <NavIcon label="✓" />
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() =>
                onOpenGradebook(
                  selectedDisciplineId ?? undefined,
                  selectedGroupId ?? undefined
                )
              }
            >
              <NavIcon label="▦" />
              Ведомость
            </button>
          </nav>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">BI-КОНТУР</p>

          <nav className="main-nav">
            <button className="nav-item" type="button" onClick={onOpenAnalytics}>
              <NavIcon label="↗" />
              Модуль аналитики
            </button>
          </nav>
        </div>

        <button className="logout-button" type="button" onClick={onLogout}>
          <NavIcon label="↪" />
          Выйти
        </button>
      </aside>

      <main className="attendance-content">
        {onBackToDiscipline && selectedDisciplineId && (
          <button
            className="teacher-back-link"
            type="button"
            onClick={onBackToDiscipline}
          >
            ← Назад к дисциплине
          </button>
        )}

        <section className="attendance-topline">
          <div>
            <h1>{attendance?.disciplineName ?? "Посещаемость"}</h1>
            <p>
              {attendance
                ? `${attendance.courseNo} курс · ${attendance.groupName}`
                : "Выберите дисциплину и группу"}
            </p>
          </div>

          <button
            className="export-button"
            type="button"
            onClick={handleExport}
            disabled={!attendance}
          >
            Экспорт
          </button>
        </section>

        <section className="attendance-filters">
          <label>
            <span>Дисциплина</span>
            <select
              value={selectedDisciplineId ?? ""}
              onChange={(event) => {
                setSelectedDisciplineId(Number(event.target.value));
                setSelectedGroupId(null);
              }}
              disabled={isLoading}
            >
              {uniqueDisciplines.map((discipline) => (
                <option
                  key={discipline.idDiscipline}
                  value={discipline.idDiscipline}
                >
                  {discipline.disciplineName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Группа</span>
            <select
              value={selectedGroupId ?? ""}
              onChange={(event) => setSelectedGroupId(Number(event.target.value))}
              disabled={isLoading || groupOptions.length === 0}
            >
              {groupOptions.map((item) => (
                <option key={item.idGroup} value={item.idGroup}>
                  {item.groupName}
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading && <div className="attendance-state">Загружаем данные...</div>}

        {error && <div className="attendance-error">{error}</div>}

        {!isLoading && !error && isAttendanceLoading && (
          <div className="attendance-state">Загружаем посещаемость...</div>
        )}

        {!isLoading && !error && attendance && (
          <>
            <section className="attendance-table-card">
              <div className="attendance-table-card-header">
                <div>
                  <h2>Посещаемость</h2>
                  <p>
                    Отмечено {presentCount} из {totalMarks} посещений
                  </p>
                </div>
              </div>

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

                          const status = mark?.status ?? "absent";

                          return (
                            <td key={session.idSession}>
                              <button
                                className={`attendance-mark ${status}`}
                                type="button"
                                onClick={() =>
                                  toggleStatus(student.idStudent, session.idSession)
                                }
                                aria-label={
                                  status === "present"
                                    ? "Отметить отсутствие"
                                    : "Отметить присутствие"
                                }
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

              {saveMessage && (
                <div className="attendance-save-message">{saveMessage}</div>
              )}
            </section>

            <div className="attendance-actions">
              <button
                className="attendance-action-button secondary"
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Отменить
              </button>

              <button
                className="attendance-action-button primary"
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}