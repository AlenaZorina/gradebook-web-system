import { useEffect, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import type { LoginResponse } from "./api";

function App() {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
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
          Роль пользователя: <strong>{currentUser.role}</strong>
        </p>

        <div
          style={{
            padding: "24px",
            borderRadius: "22px",
            background: "#f4f6ff",
            marginBottom: "24px"
          }}
        >
          <strong>Следующий экран:</strong>{" "}
          {currentUser.role === "teacher"
            ? "Расписание преподавателя"
            : currentUser.role === "student"
              ? "Расписание студента"
              : "Рабочее место учебного офиса"}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("currentUser");
            setCurrentUser(null);
          }}
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