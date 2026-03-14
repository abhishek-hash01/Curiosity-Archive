import { AppState } from '../types';
import { useStore } from '../store/useStore';

export const exportData = () => {
  const state = useStore.getState();
  const dataToExport: AppState = {
    weeks: state.weeks,
    projects: state.projects,
  };

  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
    type: 'application/json',
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `curiosity-archive-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (e.target?.result && typeof e.target.result === 'string') {
          const parsedData = JSON.parse(e.target.result) as AppState;
          
          // Basic validation to ensure it looks like an AppState
          if (parsedData.weeks !== undefined) {
            useStore.getState().importData(parsedData);
            resolve(true);
            return;
          }
        }
        resolve(false);
      } catch (err) {
        console.error('Failed to parse import file', err);
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      resolve(false);
    };
    
    reader.readAsText(file);
  });
};
