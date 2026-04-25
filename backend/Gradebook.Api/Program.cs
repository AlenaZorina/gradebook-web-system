using DotNetEnv;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Загружаем .env из корня репозитория
var envPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"));
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("DB_CONNECTION_STRING not found in .env");
}

builder.Services.AddOpenApi();

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

var app = builder.Build();

app.UseCors("frontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "Gradebook.Api"
}));

app.MapGet("/db-test", async () =>
{
    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    await using var command = new NpgsqlCommand(
        "SELECT current_database(), current_user, NOW();",
        connection
    );

    await using var reader = await command.ExecuteReaderAsync();
    await reader.ReadAsync();

    return Results.Ok(new
    {
        database = reader.GetString(0),
        user = reader.GetString(1),
        serverTime = reader.GetDateTime(2)
    });
});

app.Run();