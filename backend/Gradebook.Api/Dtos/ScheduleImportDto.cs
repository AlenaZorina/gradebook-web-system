namespace Gradebook.Api.Dtos;

public class HseScheduleImportRequestDto
{
    public int ModuleNo { get; set; } = 4;

    public bool OnlyLatest { get; set; } = true;
}

public class HseScheduleImportResultDto
{
    public int FoundLinksCount { get; set; }

    public int DownloadedFilesCount { get; set; }

    public int CreatedImportsCount { get; set; }

    public int DuplicateFilesCount { get; set; }

    public int AddedEntriesCount { get; set; }

    public int SkippedEntriesCount { get; set; }

    public int CreatedDisciplinesCount { get; set; }

    public int CreatedTeachersCount { get; set; }

    public int CreatedGroupsCount { get; set; }

    public int CreatedAssignmentsCount { get; set; }

    public int CreatedAttendanceSessionsCount { get; set; }

    public List<string> Warnings { get; set; } = new();
}