# General Agent Rules

This file contains behavioral and coding rules for Claude Code and any other AI agents operating in this workspace.

## 🚨 CRITICAL RULE: NO GIT OPERATIONS 🚨
**STRICT RULE:** You are STRICTLY FORBIDDEN from interacting with git or any version control system. 
- DO NOT run `git commit`, `git push`, `git add`, `git checkout`, or any other git commands.
- DO NOT modify the `.git` folder.
- All version control operations will be handled manually by the human developer. 

## Popular Best Practices
1. **No Placeholders:** Never use placeholders like `// ... rest of the code` or `// TODO: implement`. Always write complete, working implementations.
2. **Think First:** Analyze the existing codebase, context, and requirements fully before writing code. Make a plan for complex changes.
3. **Small Steps:** Break large refactors or feature additions into smaller, verifiable steps.
4. **Follow Conventions:** Match the existing code style, naming conventions, and architecture of the project. Do not introduce new frameworks or patterns unless explicitly asked.
5. **Clarify Ambiguity:** If the user's request is ambiguous or underspecified, ask for clarification instead of guessing their intent.
6. **Clean Code:** Write modular, maintainable, and readable code. Keep functions small and focused on a single responsibility.
