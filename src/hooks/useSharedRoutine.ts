import { useEffect, useState } from "react";
import type { SkillDefinition } from "../models/SkillDefinition";
import { processSharedParam } from "../utils/routineSharing";

interface UseSharedRoutineArgs {
  library: SkillDefinition[];
  currentRoutine: SkillDefinition[];
  setRoutine: (routine: SkillDefinition[]) => void;
}

interface PendingConfirm {
  routine: SkillDefinition[];
  missingCount: number;
}

export interface SharedRoutineState {
  pendingConfirm: PendingConfirm | null;
  warning: string | null;
  error: string | null;
  acceptShared: () => void;
  dismissShared: () => void;
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
  currentRoutine,
  setRoutine,
}: UseSharedRoutineArgs): SharedRoutineState {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    if (library.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const raw = params.get("r");
    const action = processSharedParam(raw, library, currentRoutine.length > 0);

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

    if (action.kind === "apply") {
      setRoutine(action.routine);
      if (action.missingCount > 0) {
        setWarning(warningMessage(action.missingCount));
      }
      return;
    }

    setPendingConfirm({
      routine: action.routine,
      missingCount: action.missingCount,
    });
  }, [library, processed, currentRoutine.length, setRoutine]);

  const acceptShared = () => {
    if (!pendingConfirm) return;
    setRoutine(pendingConfirm.routine);
    if (pendingConfirm.missingCount > 0) {
      setWarning(warningMessage(pendingConfirm.missingCount));
    }
    setPendingConfirm(null);
  };

  const dismissShared = () => setPendingConfirm(null);
  const dismissWarning = () => setWarning(null);
  const dismissError = () => setError(null);

  return {
    pendingConfirm,
    warning,
    error,
    acceptShared,
    dismissShared,
    dismissWarning,
    dismissError,
  };
}
