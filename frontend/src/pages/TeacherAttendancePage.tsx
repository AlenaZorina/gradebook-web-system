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

type TeacherAttendancePageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  initialGroupId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
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

export function TeacherAttendancePage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenGradebook,
  onOpenAnalytics
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
          data.find((item) => item.idDiscipline === initialDisciplineId) ?? data[0];

        if (!selectedDisciplineId && initialDiscipline) {
          setSelectedDisciplineId(initialDiscipline.idDiscipline);
        }

        const initialGroup =
          data.find(
            (item) =>
              item.idDiscipline === initialDiscipline?.idDiscipline &&
              item.idGroup === initialGroupId
          ) ??
          data.find((item) => item.idDiscipline === initialDiscipline?.idDiscipline);

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
        const mark = student.marks.find((item) => item.idSession === session.idSession);
        return mark?.status === "present" ? "присутствовал" : "отсутствовал";
      })
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
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
    <main className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getTeacherInitials(user)}
            </div>

            <div>
              <p>{getTeacherShortName(user)}</p>
              <span>Преподаватель кафедры ИТБ</span>
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
                onOpenGradebook(selectedDisciplineId ?? undefined, selectedGroupId ?? undefined)
              }
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

      <section className="attendance-content">
        <header className="attendance-topline">
          <div>
            <h1>{attendance?.disciplineName ?? "Посещаемость"}</h1>
            <p>
              {attendance
                ? `${attendance.courseNo} курс · ${attendance.groupName}`
                : "Выберите дисциплину и группу"}
            </p>
          </div>

          <button
            className="attendance-action-button secondary export-button"
            type="button"
            onClick={handleExport}
            disabled={!attendance}
          >
            Экспорт
          </button>
        </header>

        <div className="attendance-filters">
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
                <option key={discipline.idDiscipline} value={discipline.idDiscipline}>
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
        </div>

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
                                type="button"
                                className={`attendance-mark ${status}`}
                                onClick={() => toggleStatus(student.idStudent, session.idSession)}
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
            </section>

            {saveMessage && <div className="attendance-save-message">{saveMessage}</div>}

            <div className="attendance-actions">
              <button className="attendance-action-button ghost" type="button" onClick={handleCancel}>
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
      </section>
    </main>
  );
}