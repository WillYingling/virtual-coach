// Sample predefined routine requirements
// This can be expanded with more complex requirements later

import type {
  RoutineRequirement,
  RoutineRule,
} from "../models/RoutineRequirements";
import { COMMON_VALIDATORS } from "../utils/requirementValidation";

function exactSkillsRoutine(
  skillNames: string[],
  skillPositions: string[],
): RoutineRule[] {
  let rules = skillNames.map((name, index) =>
    COMMON_VALIDATORS.skillAtIndex(index, name, skillPositions[index]),
  );
  return [COMMON_VALIDATORS.exactSkills(skillNames.length), ...rules];
}

function usagRules(): RoutineRule[] {
  return [
    COMMON_VALIDATORS.exactSkills(10),
    COMMON_VALIDATORS.noDuplicates(),
    COMMON_VALIDATORS.endPosition("Standing"),
    COMMON_VALIDATORS.startPosition("Standing"),
  ];
}

export const SAMPLE_REQUIREMENTS: RoutineRequirement[] = [
  {
    id: "usag-1",
    name: "USAG Level 1",
    description: "Routine meeting USAG Level 1 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "Position Jump",
        "Position Jump",
        "Position Jump",
        "Seat Drop",
        "Seat to Feet",
        "1/2 Twist",
        "Seat Drop",
        "Seat to Hands and Knees",
        "Hands and Knees to Stomach",
        "Stomach to Feet",
      ],
      [
        "Tuck",
        "Pike",
        "Straddle",
        "Pike",
        "Pike",
        "StraightArmsDown",
        "Pike",
        "Pike",
        "Tuck",
        "Pike",
      ],
    ),
  },
  {
    id: "usag-2",
    name: "USAG Level 2",
    description: "Routine meeting USAG Level 2 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "Seat Drop",
        "Seat to Stomach",
        "Stomach to Feet",
        "Position Jump", // Tuck
        "1/2 Twist to Seat",
        "Seat to Feet",
        "Position Jump", // Pike
        "Position Jump", // Straddle
        "Back Drop",
        "Back to Feet",
      ],
      [
        "Free",
        "Free",
        "Free",
        "Tuck",
        "Free",
        "Free",
        "Pike",
        "Straddle",
        "Free",
        "Free",
      ],
    ),
  },
  {
    id: "usag-3",
    name: "USAG Level 3",
    description: "Routine meeting USAG Level 3 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "Stomach Drop",
        "Stomach to Seat",
        "Seat to Feet",
        "Position Jump",
        "Seat Drop",
        "Swivel Hips",
        "1/2 Twist Seat to Feet",
        "Position Jump",
        "Position Jump",
        "Front Flip",
      ],
      [
        "Free",
        "Free",
        "Free",
        "Tuck",
        "Free",
        "Free",
        "Free",
        "Pike",
        "Straddle",
        "Tuck",
      ],
    ),
  },
  {
    id: "usag-4",
    name: "USAG Level 4",
    description: "Routine meeting USAG Level 4 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "Back Flip",
        "Position Jump", // Tuck
        "Full Twist",
        "Position Jump", // Straddle
        "1/2 Twist to Stomach",
        "Stomach to Seat",
        "Seat to Feet",
        "1/2 Twist",
        "Position Jump", // Pike
        "Front Flip",
      ],
      [
        "Tuck",
        "Tuck",
        "Free",
        "Straddle",
        "Free",
        "Free",
        "Free",
        "Free",
        "Pike",
        "Pike",
      ],
    ),
  },
  {
    id: "usag-5",
    name: "USAG Level 5",
    description: "Routine meeting USAG Level 5 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "Back Flip",
        "Position Jump", // Tuck
        "Back Flip",
        "Position Jump", // Straddle
        "1/2 Twist to Stomach",
        "Stomach to Back",
        "Back to Feet",
        "1/2 Twist",
        "Position Jump", // Pike
        "Barani",
      ],
      [
        "Tuck",
        "Tuck",
        "Tuck",
        "Straddle",
        "Free",
        "Free",
        "Free",
        "Free",
        "Pike",
        "Pike",
      ],
    ),
  },
  {
    id: "usag-6",
    name: "USAG Level 6",
    description: "Routine meeting USAG Level 6 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "3/4 Back Flip",
        "Cruise",
        "Stomach to Feet",
        "Position Jump", // Tuck
        "Back Flip",
        "Barani",
        "Position Jump", // Pike
        "Position Jump", // Straddle
        "Barani",
        "Back Flip",
      ],
      [
        "StraightArmsDown",
        "Free",
        "Free",
        "Tuck",
        "Pike",
        "Pike",
        "Pike",
        "Straddle",
        "Tuck",
        "StraightArmsDown",
      ],
    ),
  },
  {
    id: "usag-7",
    name: "USAG Level 7",
    description: "Routine meeting USAG Level 7 requirements",
    category: "USAG Official Routines",
    difficulty: "Beginner",
    rules: exactSkillsRoutine(
      [
        "Back Flip",
        "Barani",
        "Back Flip",
        "Position Jump", // Pike
        "Back Flip",
        "Barani",
        "Position Jump", // Tuck
        "Position Jump", // Straddle
        "3/4 Front Flip",
        "Barani Ball out",
      ],
      [
        "StraightArmsDown",
        "StraightArmsDown",
        "Tuck",
        "Pike",
        "Pike",
        "Pike",
        "Tuck",
        "Straddle",
        "StraightArmsDown",
        "Tuck",
      ],
    ),
  },
  {
    id: "usag-8-1",
    name: "USAG Level 8 Routine 1",
    description: "Routine meeting USAG Level 8 requirements",
    category: "USAG Official Routines",
    difficulty: "Intermediate",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxElementDifficulty(0.9),
      COMMON_VALIDATORS.maxNonSommersaults(3),
      COMMON_VALIDATORS.minElementsWithMinRotation(7, 0.75),
    ],
  },
  {
    id: "usag-8-2",
    name: "USAG Level 8 Routine 2",
    description: "Routine meeting USAG Level 8 requirements",
    category: "USAG Official Routines",
    difficulty: "Intermediate",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxElementDifficulty(0.9),
      COMMON_VALIDATORS.minDifficulty(4.0),
      COMMON_VALIDATORS.maxDifficulty(6.0),
      COMMON_VALIDATORS.minElementFlipsAndTwists(1, 1, 1), // At least 1 element with at least 1 flip and 1 twist
    ],
  },
  {
    id: "usag-9-1",
    name: "USAG Level 9 Routine 1",
    description: "Routine meeting USAG Level 9 requirements",
    category: "USAG Official Routines",
    difficulty: "Advanced",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxNonSommersaults(2),
      COMMON_VALIDATORS.minElementsWithMinRotation(8, 0.75),
      COMMON_VALIDATORS.maxElementDifficulty(1.3),
      COMMON_VALIDATORS.or([
        COMMON_VALIDATORS.includesSequence(
          ["3/4 Front Flip", "Barani Ball Out"],
          ["StraightArmsDown", "Free"],
        ),
        COMMON_VALIDATORS.includesSequence(
          ["3/4 Back Flip", "Cody"],
          ["Free", "Free"],
        ),
      ]),
    ],
  },
  {
    id: "usag-9-2",
    name: "USAG Level 9 Routine 2",
    description: "Routine meeting USAG Level 9 requirements",
    category: "USAG Official Routines",
    difficulty: "Advanced",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxElementDifficulty(1.3),
      COMMON_VALIDATORS.minDifficulty(5.5),
      COMMON_VALIDATORS.maxDifficulty(7.5),
      COMMON_VALIDATORS.minElementsWithMinRotation(1, 2.0), // At least 1 element with at least 2 flips
    ],
  },
  {
    id: "usag-10-1",
    name: "USAG Level 10 Routine 1",
    description: "Routine meeting USAG Level 10 requirements",
    category: "USAG Official Routines",
    difficulty: "Advanced",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxNonSommersaults(1),
      COMMON_VALIDATORS.minElementsWithMinRotation(9, 0.75),
      COMMON_VALIDATORS.maxElementDifficulty(1.7),
      COMMON_VALIDATORS.includeSkill("Rudy", "StraightArmsDown"),
      COMMON_VALIDATORS.maxElementsWithMinRotation(0, 3.0),
      COMMON_VALIDATORS.or([
        COMMON_VALIDATORS.includesSequence(
          ["3/4 Front Flip", "Barani Ball Out"],
          ["StraightArmsDown", "Free"],
        ),
        COMMON_VALIDATORS.includesSequence(
          ["3/4 Back Flip", "Cody"],
          ["Free", "Free"],
        ),
      ]),
    ],
  },
  {
    id: "usag-10-2",
    name: "USAG Level 10 Routine 2",
    description: "Routine meeting USAG Level 10 requirements",
    category: "USAG Official Routines",
    difficulty: "Advanced",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.includeSkill("Barani Out", "Free"),
      COMMON_VALIDATORS.maxElementDifficulty(1.7),
      COMMON_VALIDATORS.minDifficulty(7.0),
      COMMON_VALIDATORS.maxDifficulty(11.5),
      COMMON_VALIDATORS.maxElementsWithMinRotation(0, 3.0),
    ],
  },
  {
    id: "usag-open-1",
    name: "USAG Open Routine 1",
    description: "Routine meeting USAG open finals requirements",
    category: "USAG Official Routines",
    difficulty: "Advanced",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxNonSommersaults(1),
      COMMON_VALIDATORS.minElementsWithMinRotation(9, 0.75),
      COMMON_VALIDATORS.maxElementDifficulty(2.0),
      COMMON_VALIDATORS.or([
        COMMON_VALIDATORS.includesSequence(
          ["3/4 Front Flip", "Barani Ball Out"],
          ["StraightArmsDown", "Free"],
        ),
        COMMON_VALIDATORS.includesSequence(
          ["3/4 Back Flip", "Cody"],
          ["Free", "Free"],
        ),
      ]),
    ],
  },
  {
    id: "usag-open-2",
    name: "USAG Open Routine 2",
    description: "Routine meeting USAG open finals requirements",
    category: "USAG Official Routines",
    difficulty: "Advanced",
    rules: [
      ...usagRules(),
      COMMON_VALIDATORS.maxElementDifficulty(2.0),
      COMMON_VALIDATORS.minDifficulty(7.0),
    ],
  },
];
