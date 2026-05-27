'use client';
 
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
 
interface AppState {
  currentStage: number;
  artifacts: string[];
  selectedArtifact: string | null;
  selectedContent: string;
}
 
interface DataContextType {
  state: AppState;
  setSelectedArtifact: (artifact: string | null) => void;
  refresh: () => void;
}
 
const DataContext = createContext<DataContextType | undefined>(undefined);
 
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentStage: 0,
    artifacts: [],
    selectedArtifact: null,
    selectedContent: 'Select an artifact to view content.',
  });
 
  const fetchStageAndArtifacts = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('API fetch failed');
      const { currentStage, artifacts } = await res.json();
      setState((prev) => ({ ...prev, currentStage, artifacts }));
    } catch (error) {
      console.warn('Failed to fetch stage/artifacts:', error);
    }
  }, []);
 
  const fetchContent = useCallback(async (artifact: string | null) => {
    if (!artifact) {
      setState((prev) => ({
        ...prev,
        selectedArtifact: null,
        selectedContent: 'Select an artifact to view content.',
      }));
      return;
    }
    try {
      const res = await fetch(`/api/data?file=${encodeURIComponent(artifact)}`);
      if (!res.ok) throw new Error('API fetch failed');
      const { content } = await res.json();
      setState((prev) => ({
        ...prev,
        selectedArtifact: artifact,
        selectedContent: content,
      }));
    } catch (error) {
      console.warn(`Failed to fetch content for ${artifact}:`, error);
      setState((prev) => ({
        ...prev,
        selectedArtifact: artifact,
        selectedContent: 'Content not available.',
      }));
    }
  }, []);
 
  // Manual refresh — called after triggering a new run
  const refresh = useCallback(() => {
    fetchStageAndArtifacts();
  }, [fetchStageAndArtifacts]);
 
  // Initial load + poll every 4s
  useEffect(() => {
    fetchStageAndArtifacts();
    const interval = setInterval(fetchStageAndArtifacts, 4000);
    return () => clearInterval(interval);
  }, [fetchStageAndArtifacts]);
 
  // Refetch content when selection changes
  useEffect(() => {
    fetchContent(state.selectedArtifact);
  }, [state.selectedArtifact, fetchContent]);
 
  const setSelectedArtifact = (artifact: string | null) => {
    setState((prev) => ({ ...prev, selectedArtifact: artifact }));
  };
 
  return (
    <DataContext.Provider value={{ state, setSelectedArtifact, refresh }}>
      {children}
    </DataContext.Provider>
  );
};
 
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
 