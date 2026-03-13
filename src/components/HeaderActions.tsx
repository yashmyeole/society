"use client";

import { useEffect, useRef, useState } from "react";

interface HeaderAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "neutral" | "danger";
}

interface HeaderActionsProps {
  actions?: HeaderAction[];
  onLogout: () => void;
}

const getActionStyles = (variant: HeaderAction["variant"] = "neutral") => {
  if (variant === "primary") {
    return "bg-blue-600 text-white hover:bg-blue-700";
  }

  if (variant === "danger") {
    return "bg-red-600 text-white hover:bg-red-700";
  }

  return "bg-gray-100 text-gray-700 hover:bg-gray-200";
};

export function HeaderActions({ actions = [], onLogout }: HeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", onOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <div className="hidden sm:flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${getActionStyles(action.variant)}`}
          >
            {action.label}
          </button>
        ))}
        <button
          onClick={onLogout}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v8m0 0l-3-3m3 3l3-3m6 4a9 9 0 11-18 0"
            />
          </svg>
        </button>
      </div>

      <div className="sm:hidden">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          aria-label="Open navigation actions"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg p-2 z-50">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${getActionStyles(action.variant)}`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${actions.length > 0 ? "mt-2 pt-3 border-t border-gray-200 text-red-700 hover:bg-red-50" : "text-red-700 hover:bg-red-50"}`}
              title="Sign out"
              aria-label="Sign out"
            >
              <span className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-red-600 text-white">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v8m0 0l-3-3m3 3l3-3m6 4a9 9 0 11-18 0"
                  />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
