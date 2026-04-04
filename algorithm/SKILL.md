---
name: algorithm
description: Expert algorithm implementation with optimal complexity, edge cases, and tests. Use when user says "/algorithm", "implement algorithm", "optimize function", or asks for a function with time/space complexity requirements.
---

# Algorithm Skill

When the user provides a simple algorithm request, deliver expert-level output automatically.

## Workflow

1. **Understand the problem** — identify the core algorithm needed
2. **Choose the optimal approach** — select the best algorithm with optimal time/space complexity
3. **Implement** with:
   - Optimal time and space complexity (state Big-O in a doc comment)
   - No unnecessary allocations or copies
   - Correct handling of Unicode (emoji, accented characters, combining marks) when working with strings
   - Edge case handling (empty input, single element, boundary values)
4. **Write unit tests** covering:
   - Edge cases (empty, single element, boundary)
   - Normal cases (odd/even length, positive/negative)
   - Non-obvious cases (Unicode, special characters, large input)
   - Performance stress test (large input size)
5. **Output code in the conversation only** — do not create files unless the user explicitly asks

## Rules

- Always use the two-pointer technique for comparison problems when applicable
- Never use naive approaches when an optimal solution exists (e.g., no `reversed()` copy for palindrome)
- Always state time and space complexity in the doc comment
- Always include unit tests — this is not optional
- Do not create files — output code inline in the conversation
- Language defaults to Swift unless the user specifies otherwise
