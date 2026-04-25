using DotNetEnv;
using Gradebook.Api.Data;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var envPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"));
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

/*var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
connectionString = connectionString?.Trim().Trim('"');

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("DB_CONNECTION_STRING not found in .env");
}*/
var connectionString = "Host=ep-silent-union-aliohjcl-pooler.c-3.eu-central-1.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=npg_vUyAEPOdN6L1;SSL Mode=Require;Trust Server Certificate=true;Timeout=30;Command Timeout=30;Pooling=false";


builder.Services.AddSingleton(new DbConnectionFactory(connectionString));
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

var app = builder.Build();

app.UseCors("frontend");

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "Gradebook.Api"
}));

app.MapGet("/db-test", async (DbConnectionFactory factory) =>
{
    await using var connection = factory.CreateConnection();
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

app.MapControllers();

app.Run();