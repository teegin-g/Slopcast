# Agent system overview

I keep running into the problem that after a little bit of agentic development, the coding agent gets totally stuck and I have to revert back multiple changes or start from scratch, for example I had cursor implement a debugging system to help agents see whats happening on the app and it ended up breaking it such that the app wouldn't loada and despite multiple follow ups it still claimed to be correct. so I want to create an agent system using agents.md, skills, hooks, etc, for this project that heelps me alleviate this issue.

I want it to involve multiple separate agents, so that building and implementing the feature is separate from testing and validating. I also want the ability to have agents work in parallel, so multiple features can be implemented at once. Maybe have something like a supervisor agent coordinate work.

The way it should work is the user inputs an idea for a feature or change, a main agent asks questions and creates a plan (claude code / codex / cursors plan mode/planning sub agent), user either accepts or solicits feedback, then each feature is sent off to be built by an implementation agent and then reviewed by a testing / validation agent to make sure no regressions or bugs popped up, then its sent back to the supervisor, once both are complete, the supervisor integrates/merges the features and validates that the app still works, then has the user review it to ensure validity.

Additionally for validation, I want comprehensive testing and validation requirements to prevent regressions and UI bugs, such as components failing to render entirely, rendering off screen, inconsistent state management, high latency, or any performance issues in general.

Finally, I want the main system to exist in a folder that’s then accessed by cursor / codex / claude, that way I can run the system from any agent interface. Use skills, tools, MCPs, agents.md, etc, whatever you need to build a robust system.
