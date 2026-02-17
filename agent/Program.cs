using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using OpenAI;
using System.ComponentModel;
using System.Text.Json.Serialization;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.TypeInfoResolverChain.Add(BoardAgentSerializerContext.Default));
builder.Services.AddAGUI();

WebApplication app = builder.Build();

// Create the agent factory and map the AG-UI agent endpoint
var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
var jsonOptions = app.Services.GetRequiredService<IOptions<JsonOptions>>();
var agentFactory = new BoardAgentFactory(builder.Configuration, loggerFactory, jsonOptions.Value.SerializerOptions);
app.MapAGUI("/", agentFactory.CreateBoardAgent());

await app.RunAsync();

// =================
// State Management
// =================
public class BoardState
{
    public List<BoardIssue> Issues { get; set; } = [];
    public string ProjectName { get; set; } = "Pasithea";
}

// =================
// Agent Factory
// =================
public class BoardAgentFactory
{
    private readonly IConfiguration _configuration;
    private readonly BoardState _state;
    private readonly OpenAIClient _openAiClient;
    private readonly ILogger _logger;
    private readonly System.Text.Json.JsonSerializerOptions _jsonSerializerOptions;

    public BoardAgentFactory(IConfiguration configuration, ILoggerFactory loggerFactory, System.Text.Json.JsonSerializerOptions jsonSerializerOptions)
    {
        _configuration = configuration;
        _state = new();
        _logger = loggerFactory.CreateLogger<BoardAgentFactory>();
        _jsonSerializerOptions = jsonSerializerOptions;

        var githubToken = _configuration["GitHubToken"]
            ?? throw new InvalidOperationException(
                "GitHubToken not found in configuration. " +
                "Please set it using: dotnet user-secrets set GitHubToken \"<your-token>\" " +
                "or get it using: gh auth token");

        _openAiClient = new(
            new System.ClientModel.ApiKeyCredential(githubToken),
            new OpenAIClientOptions
            {
                Endpoint = new Uri("https://models.inference.ai.azure.com")
            });
    }

    public AIAgent CreateBoardAgent()
    {
        var chatClient = _openAiClient.GetChatClient("gpt-4o-mini").AsIChatClient();

        var chatClientAgent = new ChatClientAgent(
            chatClient,
            name: "BoardAgent",
            description: @"You are a project management assistant for the Pasithea board.
            You help users manage issues on a Kanban board with four columns: Backlog, To Do, In Progress, and Done.
            You have tools to get, create, update, delete, and move issues.
            When discussing the board, ALWAYS use the get_issues tool to see the current state before responding.",
            tools: [
                AIFunctionFactory.Create(GetIssues, options: new() { Name = "get_issues", SerializerOptions = _jsonSerializerOptions }),
                AIFunctionFactory.Create(CreateIssue, options: new() { Name = "create_issue", SerializerOptions = _jsonSerializerOptions }),
                AIFunctionFactory.Create(UpdateIssue, options: new() { Name = "update_issue", SerializerOptions = _jsonSerializerOptions }),
                AIFunctionFactory.Create(DeleteIssue, options: new() { Name = "delete_issue", SerializerOptions = _jsonSerializerOptions }),
                AIFunctionFactory.Create(MoveIssue, options: new() { Name = "move_issue", SerializerOptions = _jsonSerializerOptions }),
            ]);

        return new SharedStateAgent(chatClientAgent, _jsonSerializerOptions);
    }

    // =================
    // Tools
    // =================

    [Description("Get all issues on the board.")]
    private List<BoardIssue> GetIssues()
    {
        _logger.LogInformation("Getting issues, count: {Count}", _state.Issues.Count);
        return _state.Issues;
    }

    [Description("Create a new issue on the board.")]
    private BoardIssue CreateIssue(
        [Description("Title of the issue")] string title,
        [Description("Description of the issue")] string? description = null,
        [Description("Status: backlog, todo, in-progress, done")] string? status = null,
        [Description("Priority: low, medium, high, critical")] string? priority = null,
        [Description("Assignee name")] string? assignee = null,
        [Description("Labels/tags")] List<string>? labels = null)
    {
        var now = DateTime.UtcNow.ToString("o");
        var issue = new BoardIssue
        {
            Id = $"ISS-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds():X}",
            Title = title,
            Description = description ?? "",
            Status = status ?? "todo",
            Priority = priority ?? "medium",
            Assignee = assignee,
            Labels = labels ?? [],
            CreatedAt = now,
            UpdatedAt = now,
        };
        _state.Issues.Add(issue);
        _logger.LogInformation("Created issue: {Id} - {Title}", issue.Id, issue.Title);
        return issue;
    }

    [Description("Update an existing issue's fields.")]
    private string UpdateIssue(
        [Description("ID of the issue to update")] string id,
        [Description("New title")] string? title = null,
        [Description("New description")] string? description = null,
        [Description("New status: backlog, todo, in-progress, done")] string? status = null,
        [Description("New priority: low, medium, high, critical")] string? priority = null,
        [Description("New assignee")] string? assignee = null,
        [Description("New labels")] List<string>? labels = null)
    {
        var issue = _state.Issues.Find(i => i.Id == id);
        if (issue == null) return $"Issue {id} not found.";

        if (title != null) issue.Title = title;
        if (description != null) issue.Description = description;
        if (status != null) issue.Status = status;
        if (priority != null) issue.Priority = priority;
        if (assignee != null) issue.Assignee = assignee;
        if (labels != null) issue.Labels = labels;
        issue.UpdatedAt = DateTime.UtcNow.ToString("o");

        _logger.LogInformation("Updated issue: {Id}", id);
        return $"Updated issue {id}";
    }

    [Description("Delete an issue from the board.")]
    private string DeleteIssue([Description("ID of the issue to delete")] string id)
    {
        var removed = _state.Issues.RemoveAll(i => i.Id == id);
        _logger.LogInformation("Deleted issue: {Id}, removed: {Count}", id, removed);
        return removed > 0 ? $"Deleted issue {id}" : $"Issue {id} not found.";
    }

    [Description("Move an issue to a different status column.")]
    private string MoveIssue(
        [Description("ID of the issue to move")] string id,
        [Description("New status: backlog, todo, in-progress, done")] string status)
    {
        var issue = _state.Issues.Find(i => i.Id == id);
        if (issue == null) return $"Issue {id} not found.";
        issue.Status = status;
        issue.UpdatedAt = DateTime.UtcNow.ToString("o");
        _logger.LogInformation("Moved issue {Id} to {Status}", id, status);
        return $"Moved issue {id} to {status}";
    }
}

// =================
// Data Models
// =================
public class BoardIssue
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "todo";

    [JsonPropertyName("priority")]
    public string Priority { get; set; } = "medium";

    [JsonPropertyName("assignee")]
    public string? Assignee { get; set; }

    [JsonPropertyName("labels")]
    public List<string> Labels { get; set; } = [];

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public class BoardStateSnapshot
{
    [JsonPropertyName("issues")]
    public List<BoardIssue> Issues { get; set; } = [];

    [JsonPropertyName("projectName")]
    public string ProjectName { get; set; } = "Pasithea";
}

public partial class Program { }

// =================
// Serializer Context
// =================
[JsonSerializable(typeof(BoardStateSnapshot))]
[JsonSerializable(typeof(BoardIssue))]
internal sealed partial class BoardAgentSerializerContext : JsonSerializerContext;
