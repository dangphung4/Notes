var builder = DistributedApplication.CreateBuilder(args);

// Add the API project
var api = builder.AddProject<Projects.NotesAspire_Api>("api");

// Add the React project as a project reference with endpoint
var web = builder.AddProject<Projects.Notes_Web>("web")
    .WithReference(api)
    .WithEndpoint(port: 3001, scheme: "https", name: "web-https");

builder.Build().Run();