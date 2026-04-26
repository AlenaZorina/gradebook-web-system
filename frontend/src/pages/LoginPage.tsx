import { useState } from "react";
import type { FormEvent } from "react";
import { loginUser } from "../api";
import type { LoginResponse } from "../api";
import "./LoginPage.css";

type LoginPageProps = {
  onLogin: (user: LoginResponse) => void;
};

const LOGIN_MAX_LENGTH = 100;
const PASSWORD_MAX_LENGTH = 64;

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.2A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a17.2 17.2 0 0 1-2.1 3.1M6.6 6.8C3.9 8.6 2.5 12 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 4.6-1.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedLogin = login.trim();

    setError("");

    if (!trimmedLogin) {
      setError("Введите логин");
      return;
    }

    if (trimmedLogin.length > LOGIN_MAX_LENGTH) {
      setError(`Логин не должен быть длиннее ${LOGIN_MAX_LENGTH} символов`);
      return;
    }

    if (!password) {
      setError("Введите пароль");
      return;
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      setError(`Пароль не должен быть длиннее ${PASSWORD_MAX_LENGTH} символов`);
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginUser({
        login: trimmedLogin,
        password
      });

      localStorage.setItem("currentUser", JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card-simple">
        <h1>Авторизация</h1>

        <form className="login-form-simple" onSubmit={handleSubmit} noValidate>
          <label>
            Логин
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              maxLength={LOGIN_MAX_LENGTH}
              placeholder="Введите логин"
            />
          </label>

          <label>
            Пароль
            <div className="password-field">
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                maxLength={PASSWORD_MAX_LENGTH}
                placeholder="Введите пароль"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setIsPasswordVisible((value) => !value)}
                aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
              >
                {isPasswordVisible ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </label>

          {error && <div className="login-error-simple">{error}</div>}

          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Входим..." : "Войти"}
          </button>

          <button className="forgot-password" type="button">
            Забыли пароль?
          </button>
        </form>
      </section>

      <p className="login-footer">
        Если у вас возникли вопросы, свяжитесь с нами example@mail.ru
      </p>
    </main>
  );
}