---
name: binum
description: Dual-brain reasoning — Claude and Codex work in parallel on the same question, then Claude synthesizes the best answer. Use when user says "/binum" followed by a question or instruction. Works globally across all projects.
---

# Binum — Dual-Brain Reasoning (Ultra Thinking)

Two AI models think deeply about the same problem in parallel. Both use maximum reasoning. Claude synthesizes the best answer.

```
User: /binum "question"
         │
    ┌────┴────┐
    │         │
 Claude      Codex CLI
 (Opus 4.6)  (GPT-5.4)
 ultrathink  xhigh reasoning
    │         │
    └────┬────┘
         │
   Claude compares both
   and delivers the best answer
```

## Workflow

### Step 1: Parse the question

Extract the user's question/instruction from the arguments.

### Step 2: Launch both in parallel (SAME message — parallel tool calls)

**Claude's thinking:** Launch a sub-agent (Agent tool) with the user's question.
- Use `run_in_background: true`
- In the prompt, prepend: "Think very deeply about this. Use extended thinking. Be thorough and consider edge cases, trade-offs, and production implications."

**Codex's thinking:** Run `codex exec` via Bash with `--json` flag to capture reasoning.
- Use `run_in_background: true`
- Use `model_reasoning_summary="detailed"` to expose Codex's chain of thought
- Capture JSONL output, then extract reasoning + answer

```bash
codex exec "<question>" --ephemeral --json -c 'model_reasoning_summary="detailed"' -o /tmp/binum-codex-output.md 2>/dev/null | tee /tmp/binum-codex-stream.jsonl
```

**CRITICAL:** Both calls MUST be in the SAME message so they run simultaneously.

### Step 3: Print "thinking" status

Immediately after launching both, print:

```
Both brains are thinking in parallel...
- Claude (Opus 4.6) — ultra thinking mode
- Codex (GPT-5.4) — xhigh reasoning effort
```

### Step 4: Collect results when notified

When each completes (you'll be notified automatically — do NOT poll):

**For Codex:** Read `/tmp/binum-codex-stream.jsonl` and extract:
- Reasoning blocks (`"type":"reasoning"`) → Codex's thinking
- Agent messages (`"type":"agent_message"`) → Codex's answer
- Also read `/tmp/binum-codex-output.md` for the clean final answer

**For Claude:** Read the sub-agent output file.

### Step 5: Show thinking + synthesize

Once BOTH are complete, present:

```
## Binum — Dual-Brain Analysis

### Codex's thinking (GPT-5.4)
> [Codex's reasoning blocks — the chain of thought]

### Codex's answer
[Key points from Codex's final answer]

### Claude's thinking (Opus 4.6)
[Key reasoning steps from Claude's answer — how it approached the problem]

### Claude's answer
[Key points from Claude's final answer]

---

### Synthesis
[Which approach is better and why. If both agree, confirm the consensus.
If they disagree, explain the trade-offs and recommend the best path.]

### Final answer
[The merged, best answer combining strengths from both]
```

## Rules

1. **Always parallel** — never run sequentially. Both in the SAME tool-call message.
2. **Ultra thinking for both** — Claude sub-agent gets "think deeply" instruction, Codex gets `model_reasoning_summary="detailed"`.
3. **Show the thinking** — always display reasoning/chain of thought from both models.
4. **Claude decides** — Claude is the synthesizer. It picks the best answer objectively.
5. **Be honest** — if Codex's answer is better, say so. No bias.
6. **Keep synthesis concise** — the synthesis should be shorter than either individual answer.
7. **Works anywhere** — this is a global skill, not tied to any project.
