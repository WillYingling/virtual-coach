# Tests for skillConverter.ts

This directory contains comprehensive unit tests for the `skillDefinitionToSkill` function, which converts a skill definition into a timed sequence of athlete positions for animation.

## Test Structure

The tests are organized into several categories:

### Timestamps Validation
- Ensures timestamps are strictly increasing
- Verifies start (0) and end (1) timestamps
- Tests various skill types and edge cases

### Rotation Validation
- Validates rotation increases monotonically when skills have flips
- Handles different flip amounts and directions (forward vs backward skills)
- Tests cumulative twist effects on rotation direction
- Handles zero-flip skills appropriately

### Twist Validation
- Ensures twist values increase appropriately when skills have twists
- Tests different twist amounts and timing for various positions
- Validates final twist values match the skill definition

### Start and End Positions
- Verifies correct starting position joints and rotation offsets
- Tests all bed positions (Standing, Back, Stomach, Seated)
- Ensures consistent data structure

### Edge Cases and Error Handling
- Handles fractional flips
- Tests high twist amounts
- Complex skills with multiple characteristics
- Various skill combinations

### Consistency and Reproducibility
- Identical inputs produce identical outputs
- Consistent array lengths across all skill types

## Running the Tests

```bash
npm test                # Run all tests
npm test:watch         # Run tests in watch mode
npm test:coverage      # Run tests with coverage report
```

## Test Coverage

The tests cover:
- ✅ Timestamp monotonicity
- ✅ Rotation progression for all skill types
- ✅ Twist progression and timing
- ✅ Starting/ending position accuracy
- ✅ Edge cases and complex skills
- ✅ Consistency across multiple runs

All tests follow TypeScript best practices and use descriptive test names that clearly indicate what is being tested.