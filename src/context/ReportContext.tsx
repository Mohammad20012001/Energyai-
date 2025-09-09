"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of a single report card
export interface ReportCardData {
  id: string; // Unique identifier for each card
  type: string; // e.g., "حاسبة الألواح", "الجدوى الاقتصادية"
  summary: string; // A short summary of the result
  values: Record<string, string>; // Key-value pairs of the results
}

// Define the context shape
interface ReportContextType {
  reportCards: ReportCardData[];
  addReportCard: (card: ReportCardData) => void;
  removeReportCard: (id: string) => void;
  clearReport: () => void;
}

// Create the context
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Create the provider component
export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [reportCards, setReportCards] = useState<ReportCardData[]>([]);

  const addReportCard = (card: ReportCardData) => {
    setReportCards(prevCards => {
      // Avoid adding duplicates based on a simple summary check or use a more robust logic
      if (prevCards.some(existingCard => existingCard.id.split('-')[0] === card.id.split('-')[0] && existingCard.summary === card.summary)) {
        return prevCards;
      }
      return [...prevCards, card];
    });
  };

  const removeReportCard = (id: string) => {
    setReportCards(prevCards => prevCards.filter(card => card.id !== id));
  };

  const clearReport = () => {
    setReportCards([]);
  };

  const value = {
    reportCards,
    addReportCard,
    removeReportCard,
    clearReport,
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

// Create a custom hook for easy context consumption
export const useReport = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};
