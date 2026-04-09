# Claude Code Skills Collection

A collection of custom skills for [Claude Code](https://claude.ai/code) that extend its capabilities with domain-specific workflows.

## What are Claude Code Skills?

Skills are reusable instructions that teach Claude Code how to perform specialized tasks. Each skill is a markdown file with a YAML frontmatter and structured instructions. They act like expert knowledge modules that Claude follows precisely.

## Skills

### App Store & Distribution
| Skill | Description |
|-------|-------------|
| **connect-appstoreconnect** | Manage iOS apps on App Store Connect: check status, update metadata, submit builds |
| **connect-playstore** | Manage Android apps on Google Play: releases, metadata, rollouts |
| **connect-revenuecat** | Monitor RevenueCat subscriptions, revenue, and troubleshoot purchases |
| **connect-pinterest** | Publish pins, manage boards, check stats for Pinterest marketing |

### Code Quality & Design
| Skill | Description |
|-------|-------------|
| **pixel-perfect-check** | Audit SwiftUI/Compose code against Figma designs for pixel-perfect accuracy |
| **figma-to-code** | Convert Figma designs to production code with mandatory property extraction |
| **check-ds-page** | Validate a Figma page against design system rules |
| **create-ds-component** | Create reusable design system components from Figma |
| **create-ds-page** | Design full mobile screens in Figma using design system components |
| **implement-ds-page** | Implement screens from Figma using existing design system components |

### AI & Automation
| Skill | Description |
|-------|-------------|
| **binum** | Dual-brain reasoning: Claude + Codex think in parallel, Claude synthesizes |
| **algorithm** | Expert algorithm implementation with optimal complexity and tests |
| **youtube-transcript** | Extract and analyze YouTube video transcripts |
| **cards-extractor** | Detect FC player cards from screenshots using database lookup |

### ASO & SEO
| Skill | Description |
|-------|-------------|
| **audit-aso** | 16-check App Store Optimization audit with 100-point scoring |
| **audit-seo** | Full SEO audit using Google Search Console data |
| **generate-app-screenshots** | Generate professional App Store and Play Store screenshot sets |

### Development Tools
| Skill | Description |
|-------|-------------|
| **app-logs** | Capture and view runtime logs from iOS/tvOS simulators and devices |
| **job-checker** | Deep search for Senior iOS Developer jobs in Canada and remote |
| **remotion-best-practices** | Best practices for video creation with Remotion (React) |

## Installation

1. Clone this repo into your Claude Code skills directory:
```bash
git clone https://github.com/omardoucoure/claude-skills.git ~/.claude/skills
```

2. Skills are automatically available in Claude Code via `/skill-name`.

## How Skills Work

Each skill follows this structure:
```
skill-name/
  SKILL.md          # Main instructions (YAML frontmatter + markdown)
  README.md         # Optional documentation
  assets/           # Optional supporting files
```

Example SKILL.md:
```yaml
---
name: pixel-perfect-check
description: Audit component code against Figma design for pixel-perfect accuracy
---

# Instructions
[Detailed workflow for Claude to follow]
```

## Built by

[Omar Doucoure](https://omardoucoure.com) - Senior iOS Developer
