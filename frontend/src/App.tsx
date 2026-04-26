import { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { TeacherSchedulePage } from "./pages/TeacherSchedulePage";
import { TeacherDisciplinesPage } from "./pages/TeacherDisciplinesPage";
import { TeacherDisciplineDetailsPage } from "./pages/TeacherDisciplineDetailsPage";
import type { LoginResponse } from "./api";
import { TeacherAttendancePage } from "./pages/TeacherAttendancePage";

type TeacherPage =
  | "schedule"
  | "disciplines"
  | "disciplineDetails"
  | "attendance"
  | "gradebook";

function App() {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);
  const [teacherPage, setTeacherPage] = useState<TeacherPage>("schedule");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  function handleLogout() {
    setCurrentUser(null);
    setTeacherPage("schedule");
    setSelectedDisciplineId(null);
    setSelectedGroupId(null);
  }

  function openDisciplineDetails(disciplineId: number) {
    setSelectedDisciplineId(disciplineId);
    setSelectedGroupId(null);
    setTeacherPage("disciplineDetails");
  }

  function openAttendance(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setTeacherPage("attendance");
  }

  function openGradebook(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setTeacherPage("gradebook");
  }

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  if (currentUser.role === "teacher") {
    if (teacherPage === "disciplines") {
      return (
        <TeacherDisciplinesPage
          user={currentUser}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onSelectDiscipline={openDisciplineDetails}
          onOpenAttendance={() => openAttendance()}
          onOpenGradebook={() => openGradebook()}
        />
      );
    }

    if (teacherPage === "disciplineDetails" && selectedDisciplineId) {
      return (
        <TeacherDisciplineDetailsPage
          user={currentUser}
          disciplineId={selectedDisciplineId}
          initialGroupId={selectedGroupId}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onOpenDisciplines={() => setTeacherPage("disciplines")}
          onOpenAttendance={openAttendance}
          onOpenGradebook={openGradebook}
        />
      );
    }

    if (teacherPage === "attendance") {
      return (
        <TeacherAttendancePage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          initialGroupId={selectedGroupId}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onOpenDisciplines={() => setTeacherPage("disciplines")}
          onOpenGradebook={openGradebook}
        />
      );
    }

    if (teacherPage === "gradebook") {
      return (
        <main
          style={{
            minHeight: "100vh",
            padding: "48px",
            background: "#eef2ff",
            fontFamily: "Manrope, system-ui, sans-serif"
          }}
        >
          <section
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              background: "#ffffff",
              borderRadius: "28px",
              padding: "36px",
              boxShadow: "0 24px 70px rgba(27, 46, 94, 0.12)"
            }}
          >
            <h1 style={{ margin: "0 0 12px", fontSize: "32px" }}>Ведомость</h1>

            <p style={{ color: "#64748b", marginBottom: "12px" }}>
              Экран будет реализован следующим шагом.
            </p>

            <p style={{ color: "#64748b", marginBottom: "28px" }}>
              Выбранная дисциплина: <strong>{selectedDisciplineId ?? "не выбрана"}</strong>,
              группа: <strong>{selectedGroupId ?? "не выбрана"}</strong>
            </p>

            <button
              onClick={() => setTeacherPage("disciplineDetails")}
              style={{
                border: "none",
                borderRadius: "16px",
                padding: "14px 20px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Назад
            </button>
          </section>
        </main>
      );
    }

    return (
      <TeacherSchedulePage
        user={currentUser}
        onLogout={handleLogout}
        onOpenDisciplines={() => setTeacherPage("disciplines")}
        onOpenAttendance={() => openAttendance()}
        onOpenGradebook={() => openGradebook()}
      />
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px",
        background: "#eef2ff",
        fontFamily: "Manrope, system-ui, sans-serif"
      }}
    >
      <section
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "28px",
          padding: "36px",
          boxShadow: "0 24px 70px rgba(27, 46, 94, 0.12)"
        }}
      >
        <p style={{ margin: "0 0 8px", color: "#7b87a5", fontWeight: 700 }}>
          Вход выполнен
        </p>

        <h1 style={{ margin: "0 0 12px", fontSize: "32px" }}>
          Добро пожаловать, {currentUser.name}!
        </h1>

        <p style={{ color: "#64748b", marginBottom: "28px" }}>
          Для этой роли экран пока находится в разработке.
        </p>

        <button
          onClick={handleLogout}
          style={{
            border: "none",
            borderRadius: "16px",
            padding: "14px 20px",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          Выйти
        </button>
      </section>
    </main>
  );
}

export default App;