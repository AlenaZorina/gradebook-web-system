import { useEffect, useMemo, useState } from "react";
import type {
  LoginResponse,
  TeacherDisciplineDetail,
  TeacherFormulaElement
} from "../api";
import {
  getTeacherDisciplineDetails,
  updateTeacherDisciplineFormula
} from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherDisciplineDetailsPage.css";
import {
  getTeacherInitials,
  getTeacherShortName,
  getTeacherSubtitle
} from "../utils/teacherProfile";

type TeacherDisciplineDetailsPageProps = {
  user: LoginResponse;
  disciplineId: number;
  initialGroupId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: (disciplineId?: number, groupId?: number) => void;
  onOpenGradebook: (disciplineId?: number, groupId?: number) => void;
  onOpenAnalytics: () => void;
};

type FormulaDraftElement = {
  tempId: string;
  idElement?: number | null;
  elementName: string;
  weight: string;
  orderNo: number;
  controlType: string;
};

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

function getCourseText(courseNo: number) {
  return `${courseNo} курс`;
}

function buildFormulaText(elements: TeacherFormulaElement[]) {
  if (elements.length === 0) {
    return "Формула не задана";
  }

  return [...elements]
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((item) => `${formatWeight(item.weight)}*${item.elementName}`)
    .join(" + ");
}

function formatWeight(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(4))).replace(".", ",");
}

function createDraftElement(index: number): FormulaDraftElement {
  return {
    tempId: `${Date.now()}-${Math.random()}-${index}`,
    idElement: null,
    elementName: "",
    weight: "0,1",
    orderNo: index + 1,
    controlType: "custom"
  };
}

function elementsToDraft(elements: TeacherFormulaElement[]) {
  return [...elements]
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((item, index) => ({
      tempId: `${item.idElement ?? "new"}-${index}-${Date.now()}`,
      idElement: item.idElement,
      elementName: item.elementName,
      weight: String(item.weight).replace(".", ","),
      orderNo: index + 1,
      controlType: item.controlType || "custom"
    }));
}

function draftToElements(draft: FormulaDraftElement[]): TeacherFormulaElement[] {
  return draft.map((item, index) => ({
    idElement: item.idElement,
    elementName: item.elementName.trim(),
    weight: Number(item.weight.replace(",", ".")),
    orderNo: index + 1,
    controlType: item.controlType || "custom"
  }));
}

export function TeacherDisciplineDetailsPage({
  user,
  disciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: TeacherDisciplineDetailsPageProps) {
  const [details, setDetails] = useState<TeacherDisciplineDetail | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    initialGroupId ?? null
  );

  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [formulaElements, setFormulaElements] = useState<TeacherFormulaElement[]>([]);
  const [isFormulaEditing, setIsFormulaEditing] = useState(false);
  const [draftElements, setDraftElements] = useState<FormulaDraftElement[]>([]);
  const [formulaError, setFormulaError] = useState("");
  const [isFormulaSaving, setIsFormulaSaving] = useState(false);

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
        setFormulaElements(data.formulaElements ?? []);
        setIsFormulaEditing(false);
        setFormulaError("");

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

  const formulaText = useMemo(() => {
    if (formulaElements.length > 0) {
      return buildFormulaText(formulaElements);
    }

    return details?.formulaText || "Формула не задана";
  }, [formulaElements, details?.formulaText]);

  function openFormulaEditor() {
    const sourceElements =
      formulaElements.length > 0
        ? formulaElements
        : [
            {
              idElement: null,
              elementName: "Элемент",
              weight: 1,
              orderNo: 1,
              controlType: "custom"
            }
          ];

    setDraftElements(elementsToDraft(sourceElements));
    setFormulaError("");
    setIsFormulaEditing(true);
  }

  function cancelFormulaEditor() {
    setIsFormulaEditing(false);
    setFormulaError("");
  }

  function addFormulaElement() {
    setDraftElements((current) => [
      ...current,
      createDraftElement(current.length)
    ]);
  }

  function removeFormulaElement(tempId: string) {
    setDraftElements((current) =>
      current.length === 1
        ? current
        : current.filter((item) => item.tempId !== tempId)
    );
  }

  function updateDraftElement(
    tempId: string,
    field: "elementName" | "weight",
    value: string
  ) {
    setDraftElements((current) =>
      current.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  }

  async function saveFormula() {
    if (!details) {
      return;
    }

    const normalized = draftToElements(draftElements);

    if (normalized.some((item) => !item.elementName)) {
      setFormulaError("Заполните названия всех элементов контроля.");
      return;
    }

    if (
      normalized.some(
        (item) => !Number.isFinite(item.weight) || item.weight <= 0
      )
    ) {
      setFormulaError("Вес каждого элемента должен быть больше 0.");
      return;
    }

    try {
      setIsFormulaSaving(true);
      setFormulaError("");

      const response = await updateTeacherDisciplineFormula(
        user.idUser,
        details.idDiscipline,
        details.idAssignment,
        normalized
      );

      setFormulaElements(response.elements);
      setDetails((current) =>
        current
          ? {
              ...current,
              formulaText: response.formulaText,
              formulaElements: response.elements
            }
          : current
      );

      setIsFormulaEditing(false);
    } catch (err) {
      setFormulaError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить формулу оценивания"
      );
    } finally {
      setIsFormulaSaving(false);
    }
  }

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
              <span>{getTeacherSubtitle(user)}</span>
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

            <button className="nav-item active" type="button" onClick={onOpenDisciplines}>
              <span className="nav-icon">
                <DisciplineIcon />
              </span>
              Дисциплины
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenAttendance(details?.idDiscipline, selectedGroup ?? undefined)}
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenGradebook(details?.idDiscipline, selectedGroup ?? undefined)}
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

      <section className="discipline-detail-content">
        {isLoading && <div className="discipline-detail-state">Загружаем дисциплину...</div>}

        {error && <div className="discipline-detail-error">{error}</div>}

        {!isLoading && !error && details && (
          <>
            <button className="back-link" type="button" onClick={onOpenDisciplines}>
              ← Назад к дисциплинам
            </button>

            <header className="discipline-detail-header">
              <div>
                <h1>{details.disciplineName}</h1>
                <p>{getCourseText(details.courseNo)}</p>
              </div>

              <div className="discipline-detail-badge">
                {details.academicYear}
              </div>
            </header>

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
              <section className={`detail-card detail-accordion ${isFormulaOpen ? "open" : ""}`}>
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

                  <span
                    className={`detail-chevron ${isFormulaOpen ? "detail-chevron-open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isFormulaOpen && (
                  <div className="formula-body">
                    <div className="formula-box">
                      <span>{formulaText}</span>

                      <button
                        className="formula-edit-button"
                        type="button"
                        onClick={openFormulaEditor}
                        aria-label="Редактировать формулу"
                        title="Редактировать формулу"
                      >
                        ✎
                      </button>
                    </div>

                    {isFormulaEditing && (
                      <div className="formula-editor">
                        <div className="formula-editor-header">
                          <h3>Редактирование формулы</h3>
                          <p>
                            Элемент формулы состоит из веса и названия элемента контроля.
                            Например: 0,3 * ЛР1.
                          </p>
                        </div>

                        <div className="formula-editor-list">
                          {draftElements.map((item, index) => (
                            <div className="formula-editor-row" key={item.tempId}>
                              <label>
                                Вес
                                <input
                                  value={item.weight}
                                  onChange={(event) =>
                                    updateDraftElement(
                                      item.tempId,
                                      "weight",
                                      event.target.value
                                    )
                                  }
                                  placeholder="0,3"
                                />
                              </label>

                              <span className="formula-editor-multiply">*</span>

                              <label>
                                Элемент контроля
                                <input
                                  value={item.elementName}
                                  onChange={(event) =>
                                    updateDraftElement(
                                      item.tempId,
                                      "elementName",
                                      event.target.value
                                    )
                                  }
                                  placeholder={`ЛР${index + 1}`}
                                />
                              </label>

                              <button
                                className="formula-delete-button"
                                type="button"
                                onClick={() => removeFormulaElement(item.tempId)}
                                disabled={draftElements.length === 1}
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>

                        {formulaError && (
                          <div className="formula-editor-error">
                            {formulaError}
                          </div>
                        )}

                        <div className="formula-editor-actions">
                          <button
                            className="formula-add-button"
                            type="button"
                            onClick={addFormulaElement}
                          >
                            + Добавить элемент
                          </button>

                          <div>
                            <button
                              className="formula-cancel-button"
                              type="button"
                              onClick={cancelFormulaEditor}
                              disabled={isFormulaSaving}
                            >
                              Отменить
                            </button>

                            <button
                              className="formula-save-button"
                              type="button"
                              onClick={saveFormula}
                              disabled={isFormulaSaving}
                            >
                              {isFormulaSaving ? "Сохраняем..." : "Сохранить"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <button
                className="detail-card detail-row action-row"
                type="button"
                onClick={() => onOpenAttendance(details.idDiscipline, selectedGroup ?? details.selectedGroupId)}
              >
                <div>
                  <h2>Посещаемость</h2>
                  <span>Отметить посещаемость студентов</span>
                </div>

                <span className="detail-chevron detail-chevron-right" aria-hidden="true" />
              </button>

              <button
                className="detail-card detail-row action-row"
                type="button"
                onClick={() => onOpenGradebook(details.idDiscipline, selectedGroup ?? details.selectedGroupId)}
              >
                <div>
                  <h2>Ведомость</h2>
                  <span>Ведомость по дисциплине</span>
                </div>

                <span className="detail-chevron detail-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}