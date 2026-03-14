'use client';

import { Download, Upload } from 'lucide-react';
import { exportData, importData } from '@/utils/dataPortability';

export function DataControls() {
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const success = await importData(e.target.files[0]);
      if (success) {
        alert('Data imported successfully!');
        window.location.reload();
      } else {
        alert('Failed to import data.');
      }
    }
    e.target.value = '';
  };

  return (
    <div className="flex md:flex-col flex-row gap-2">
      <button
        onClick={exportData}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        <Download className="w-4 h-4" />
        <span className="hidden md:inline">Backup JSON</span>
      </button>
      <label className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-full text-left cursor-pointer">
        <Upload className="w-4 h-4" />
        <span className="hidden md:inline">Restore JSON</span>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
}
