using Gradebook.Api.Dtos;
using Gradebook.Api.Services.ScheduleImport;
using Microsoft.AspNetCore.Mvc;

namespace Gradebook.Api.Controllers;

[ApiController]
[Route("api/users")]
public class HseScheduleImportController : ControllerBase
{
    private readonly HseScheduleImportService _importService;

    public HseScheduleImportController(HseScheduleImportService importService)
    {
        _importService = importService;
    }

    [HttpPost("{idUser:int}/office/schedule/import-hse")]
    public async Task<ActionResult<HseScheduleImportResultDto>> ImportHseSchedule(
        int idUser,
        [FromBody] HseScheduleImportRequestDto request,
        CancellationToken cancellationToken
    )
    {
        if (request.ModuleNo < 1 || request.ModuleNo > 4)
        {
            return BadRequest(new
            {
                message = "Номер модуля должен быть от 1 до 4."
            });
        }

        var result = await _importService.ImportAsync(
            idUser,
            request,
            cancellationToken
        );

        return Ok(result);
    }
}