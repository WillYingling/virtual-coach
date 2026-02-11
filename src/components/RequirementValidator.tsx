import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useState } from "react";
import type { RequirementValidationResult } from "../models/RoutineRequirements";

interface RequirementValidatorProps {
  validationResults: RequirementValidationResult[];
  title?: string;
  showProgress?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const RequirementValidator: React.FC<RequirementValidatorProps> = ({
  validationResults,
  title = "Routine Requirements",
  showProgress = true,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const passedCount = validationResults.filter(
    (result) => result.passed,
  ).length;
  const totalCount = validationResults.length;
  const allPassed = passedCount === totalCount;

  if (validationResults.length === 0) {
    return null;
  }

  const handleToggleExpanded = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  const header = (
    <CardHeader
      title={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showProgress && (
              <Chip
                size="small"
                label={`${passedCount}/${totalCount}`}
                color={
                  allPassed ? "success" : passedCount > 0 ? "warning" : "error"
                }
                variant="outlined"
              />
            )}
            {collapsible && (
              <IconButton
                onClick={handleToggleExpanded}
                size="small"
                sx={{ ml: 1 }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        </Box>
      }
      sx={{
        pb: 0,
        cursor: collapsible ? "pointer" : "default",
      }}
      onClick={collapsible ? handleToggleExpanded : undefined}
    />
  );

  const content = (
    <CardContent sx={{ pt: 1 }}>
      <List dense>
        {validationResults.map((result) => (
          <ListItem
            key={result.ruleId}
            sx={{
              px: 0,
              py: 0.5,
              minHeight: 40,
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {result.passed ? (
                <CheckCircle color="success" sx={{ fontSize: 20 }} />
              ) : (
                <Cancel color="error" sx={{ fontSize: 20 }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  color={result.passed ? "success.main" : "error.main"}
                  sx={{
                    textDecoration: result.passed ? "none" : "none",
                    fontWeight: result.passed ? 500 : 400,
                  }}
                >
                  {result.description}
                </Typography>
              }
              secondary={
                result.details && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {result.details}
                  </Typography>
                )
              }
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  );

  if (collapsible) {
    return (
      <Card variant="outlined">
        {header}
        <Collapse in={expanded} timeout="auto">
          {content}
        </Collapse>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      {header}
      {content}
    </Card>
  );
};

export default RequirementValidator;
