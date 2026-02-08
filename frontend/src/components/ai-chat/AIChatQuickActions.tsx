"use client";

export interface QuickAction {
  label: string;
  action: string;
}

interface AIChatQuickActionsProps {
  actions: QuickAction[];
  onAction?: (action: string) => void;
}

export const AIChatQuickActions = ({ actions, onAction }: AIChatQuickActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction?.(action.action)}
          className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition-all hover:border-accent hover:bg-accent/10 hover:text-accent active:scale-[0.97]"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
