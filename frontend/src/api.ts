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
  export type TeacherScheduleItem = {
    idEntry: number;
    teacherUserId: number;
    teacherShortName: string;
    department?: string | null;
    position?: string | null;
    lessonDate: string;
    startTime?: string | null;
    endTime?: string | null;
    weekNo?: number | null;
    moduleNo?: number | null;
    disciplineName: string;
    groupName: string;
  };
  
  export async function getTeacherSchedule(idUser: number): Promise<TeacherScheduleItem[]> {
    const response = await fetch(`${API_URL}/api/users/${idUser}/teacher-schedule`);
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить расписание");
    }
  
    return response.json();
  }