# Multiple Skill Sources

The `useSkillDefinitions` hook now supports loading skills from multiple sources and combining them into a single set of skills.

## Basic Usage

### Single Source (Default)

```tsx
// Loads from 'skills.json' (default)
const { skillDefinitions, selectedPositions, selectPosition, loading, error } =
  useSkillDefinitions();
```

### Multiple Sources

```tsx
// Load from multiple sources
const { skillDefinitions, selectedPositions, selectPosition, loading, error } =
  useSkillDefinitions([
    "skills.json", // Local file
    "advanced-skills.json", // Another local file
    "https://api.example.com/skills", // External API
  ]);
```

## Features

### Automatic Deduplication

Skills with the same name and position are automatically deduplicated.

### Error Handling

- Failed sources are logged but don't prevent other sources from loading
- The `error` state contains information about any failed sources
- Successfully loaded skills are still available even if some sources fail

### Loading States

- `loading`: Boolean indicating if skills are currently being loaded
- `error`: String containing error message if any sources failed to load

### Parallel Loading

All sources are loaded in parallel for optimal performance.

## File Structure Examples

### Local Files

```
public/
  skills.json          # Basic skills
  advanced-skills.json # Advanced skills
  beginner-skills.json # Beginner skills
```

### Usage in App

```tsx
// Load different skill sets based on user level
const sources = useMemo(() => {
  const baseSources = ["skills.json"];

  if (userLevel >= "intermediate") {
    baseSources.push("advanced-skills.json");
  }

  if (userLevel === "beginner") {
    baseSources.push("beginner-skills.json");
  }

  return baseSources;
}, [userLevel]);

const { skillDefinitions, loading, error } = useSkillDefinitions(sources);
```

## Error Handling in UI

The App component now displays error messages when skill loading fails:

```tsx
// Error display is automatically shown if any sources fail
{
  error && <Alert severity="warning">{error}</Alert>;
}
```

## API Response Format

External API endpoints should return an array of `SkillDefinition` objects:

```json
[
  {
    "name": "Front Flip",
    "startingPosition": "Standing",
    "endingPosition": "Standing",
    "flips": 1,
    "twists": [0, 0],
    "position": "Tuck",
    "possiblePositions": ["Tuck", "Pike", "StraightArmsDown"]
  }
]
```
