import { useEffect, useState } from "react";
import type { SkillDefinition } from "../models/SkillDefinition";
import { processSharedParam } from "../utils/routineSharing";

interface UseSharedRoutineArgs {
  library: SkillDefinition[];
  setRoutine: (routine: SkillDefinition[]) => void;
}

export interface SharedRoutineState {
  warning: string | null;
  error: string | null;
  dismissWarning: () => void;
  dismissError: () => void;
}

function warningMessage(n: number): string {
  return n === 1
    ? "1 skill from the shared routine could not be loaded and was skipped."
    : `${n} skills from the shared routine could not be loaded and were skipped.`;
}

function stripSharedParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete("r");
  window.history.replaceState(null, "", url.toString());
}

export function useSharedRoutine({
  library,
  setRoutine,
}: UseSharedRoutineArgs): SharedRoutineState {
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    if (library.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const raw = params.get("r");
    const action = processSharedParam(raw, library);

    if (action.kind === "none") {
      setProcessed(true);
      return;
    }

    stripSharedParam();
    setProcessed(true);

    if (action.kind === "error") {
      setError(action.message);
      return;
    }

    setRoutine(action.routine);
    if (action.missingCount > 0) {
      setWarning(warningMessage(action.missingCount));
    }
  }, [library, processed, setRoutine]);

  const dismissWarning = () => setWarning(null);
  const dismissError = () => setError(null);

  return {
    warning,
    error,
    dismissWarning,
    dismissError,
  };
}
