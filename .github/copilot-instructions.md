# GitHub Copilot Instructions for ASRA – German Laws

These instructions serve as a guide for development with GitHub Copilot in the ASRA – German Laws project.

## External Documentation

- **For Apache Solr documentation**, use the official documentation at solr.apache.org.
- **For React and Vite questions**, use the respective official documentation.
- **For complex Solr queries**, use the Solr Query Syntax Reference.

### Project Awareness & Context

1.  **Read `PLANNING.md`** at the beginning of a new conversation to understand the project's architecture, goals, style, and constraints.

2.  **Review `TASK.md`** before starting a new task:
    - If the task is not listed, add it with a brief description and the current date.

3.  **Follow the consistent naming conventions, file structures, and architectural patterns** as described in `PLANNING.md`.

4.  **Adhere to the existing structure of the ASRA project**:
    - Frontend with React/Vite
    - Apache Solr as the search backend
    - Docker for container management

### Code Structure & Modularity

1.  **Keep files under 500 lines of code.** If a file reaches this limit, refactor it into smaller modules or helper files.

2.  **Use clear, consistent imports:**
    - Prefer absolute imports for clarity.
    - Avoid relative imports like `.` or `..`.

3.  **Follow the existing component model:**
    - Functional React components with Hooks
    - Services for API interactions
    - Clear separation of UI logic and data processing

### Testing & Reliability

1.  **Write unit tests for all new features**, such as functions, components, and services.

2.  **Update existing unit tests** when logic is modified.

3.  **Organize tests in a `/tests` folder** that mirrors the structure of the main application. Each feature should include:
    - 1 test for expected behavior
    - 1 test for edge cases
    - 1 test for error cases

4.  **Test all Solr query functions** individually, both with mock data and a real Solr instance.

### Task Management

1.  **Mark tasks in `TASK.md` as complete** immediately after their completion.

2.  **Document new subtasks or TODOs** discovered during development in the "Discovered during work" section of `TASK.md`.

3.  **Keep the project plan up-to-date** by updating changes to the project scope or timeline in `PLANNING.md`.

### Style & Conventions

1.  **Follow the Tailwind CSS naming conventions** and use the color variables defined in the project.

2.  **Use consistent naming conventions:**
    - PascalCase for components
    - camelCase for variables and functions
    - kebab-case for CSS classes (if not using Tailwind)

3.  **Format the code with the existing indentation** of 2 spaces.

4.  **Use functional components and React Hooks** instead of class components.

### Documentation & Explainability

1.  **Update `README.md`** when features are added, dependencies are changed, or setup steps are modified.

2.  **Comment non-obvious code** to ensure it is understandable for developers.

3.  **Add `// Reason:` comments** to explain complex logic, focusing on the "why" instead of just the "what".

4.  **Document Solr schema changes** in a separate file when field types or index configurations are changed.

### AI Behavior Rules

1.  **Ask questions when context is missing**—do not make assumptions.

2.  **Verify paths and module names** before using them.

3.  **Do not delete or overwrite existing code** unless explicitly instructed or as part of a defined task.

4.  **Consider the Docker environment** when developing services and API endpoints.

5.  **Use Solr Query Parameters deliberately** and document complex queries.