import { useState } from "react";
import type { HseScheduleImportResult, LoginResponse } from "../api";
import { importHseSchedule } from "../api";
import "./HseScheduleImportPanel.css";

type HseScheduleImportPanelProps = {
  user: LoginResponse;
};

export function HseScheduleImportPanel({ user }: HseScheduleImportPanelProps) {
  const [moduleNo, setModuleNo] = useState("4");
  const [onlyLatest, setOnlyLatest] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<HseScheduleImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleImport() {
    try {
      setIsImporting(true);
      setError("");
      setResult(null);

      const importResult = await importHseSchedule(
        user.idUser,
        Number(moduleNo),
        onlyLatest
      );

      setResult(importResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ошибка импорта расписания с сайта ВШЭ"
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="hse-import-panel">
      <div className="hse-import-panel-header">
        <div>
          <span>Интеграция с внешним источником</span>
          <h2>Импорт расписания с сайта ВШЭ</h2>
          <p>
            Система находит актуальную ссылку на weekly-расписание, скачивает
            Excel-файл, распознаёт группы, дисциплины, преподавателей и пары,
            после чего записывает данные в базу.
          </p>
        </div>

        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? "Импортируем..." : "Импортировать"}
        </button>
      </div>

      <div className="hse-import-panel-controls">
        <label>
          Модуль
          <select
            value={moduleNo}
            onChange={(event) => setModuleNo(event.target.value)}
            disabled={isImporting}
          >
            <option value="1">1 модуль</option>
            <option value="2">2 модуль</option>
            <option value="3">3 модуль</option>
            <option value="4">4 модуль</option>
          </select>
        </label>

        <label className="hse-import-checkbox">
          <input
            type="checkbox"
            checked={onlyLatest}
            onChange={(event) => setOnlyLatest(event.target.checked)}
            disabled={isImporting}
          />
          Импортировать только самое актуальное расписание
        </label>
      </div>

      {error && (
        <div className="hse-import-error">
          {error}
        </div>
      )}

      {result && (
        <div className="hse-import-result">
          <div className="hse-import-result-grid">
            <article>
              <span>Найдено ссылок</span>
              <strong>{result.foundLinksCount}</strong>
            </article>

            <article>
              <span>Скачано файлов</span>
              <strong>{result.downloadedFilesCount}</strong>
            </article>

            <article>
              <span>Импортов создано</span>
              <strong>{result.createdImportsCount}</strong>
            </article>

            <article>
              <span>Дублей пропущено</span>
              <strong>{result.duplicateFilesCount}</strong>
            </article>

            <article>
              <span>Занятий добавлено</span>
              <strong>{result.addedEntriesCount}</strong>
            </article>

            <article>
              <span>Занятий пропущено</span>
              <strong>{result.skippedEntriesCount}</strong>
            </article>

            <article>
              <span>Дисциплин создано</span>
              <strong>{result.createdDisciplinesCount}</strong>
            </article>

            <article>
              <span>Преподавателей создано</span>
              <strong>{result.createdTeachersCount}</strong>
            </article>

            <article>
              <span>Групп создано</span>
              <strong>{result.createdGroupsCount}</strong>
            </article>

            <article>
              <span>Дат занятий создано</span>
              <strong>{result.createdAttendanceSessionsCount}</strong>
            </article>
          </div>

          {result.warnings.length > 0 && (
            <div className="hse-import-warnings">
              <h3>Предупреждения импорта</h3>

              <ul>
                {result.warnings.slice(0, 20).map((warning, index) => (
                  <li key={`${warning}-${index}`}>
                    {warning}
                  </li>
                ))}
              </ul>

              {result.warnings.length > 20 && (
                <p>
                  Показаны первые 20 предупреждений из {result.warnings.length}.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}