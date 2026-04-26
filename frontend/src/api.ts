export type LoginRequest = {
    login: string;
    password: string;
  };
  
  export type UserRole = "student" | "teacher" | "office_staff";
  
  export type LoginResponse = {
    idUser: number;
    login: string;
    role: UserRole;
    name: string;
    surname: string;
    fathername?: string | null;
  };
  
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5092";
  
  export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  
    if (!response.ok) {
      let message = "Не удалось войти в систему";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }