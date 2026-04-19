import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface SharedRoutineDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SharedRoutineDialog({
  open,
  onConfirm,
  onCancel,
}: SharedRoutineDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="shared-routine-title">
      <DialogTitle id="shared-routine-title">Load shared routine?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will replace your current routine.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>
          Load
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SharedRoutineDialog;
