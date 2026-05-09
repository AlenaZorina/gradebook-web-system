using DotNetEnv;
using Gradebook.Api.Services;
using Gradebook.Api.Services.ScheduleImport;

var builder = WebApplication.CreateBuilder(args);

var envPath = Path.GetFullPath(
    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env")
);

if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL");
var supabaseSecretKey = Environment.GetEnvironmentVariable("SUPABASE_SECRET_KEY");

if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(supabaseSecretKey))
{
    throw new InvalidOperationException("SUPABASE_URL or SUPABASE_SECRET_KEY not found in .env");
}

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient(nameof(SupabaseRestClient), client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddSingleton(sp =>
{
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient(nameof(SupabaseRestClient));

    return new SupabaseRestClient(
        httpClient,
        supabaseUrl!,
        supabaseSecretKey!
    );
});

builder.Services.AddHttpClient<HseScheduleCrawler>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddScoped<HseScheduleExcelParser>();
builder.Services.AddScoped<HseScheduleImportService>();

var app = builder.Build();

app.UseCors("frontend");

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "Gradebook.Api"
}));

app.MapGet("/supabase-test", async (SupabaseRestClient supabase) =>
{
    var result = await supabase.GetAsync("role?select=id_role,role_name&order=id_role.asc");

    if (!result.Success)
    {
        return Results.Problem(
            title: "Supabase REST test failed",
            detail: result.Body,
            statusCode: result.StatusCode
        );
    }

    return Results.Content(result.Body, "application/json");
});

app.MapControllers();

app.Run();