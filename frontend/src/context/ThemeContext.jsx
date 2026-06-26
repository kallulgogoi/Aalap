"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false} // Forces dark mode for that premium feel
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
