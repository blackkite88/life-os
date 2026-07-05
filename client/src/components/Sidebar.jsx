import React from 'react';

export default function Sidebar({ onReviewClick }) {
  const handleIngest = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/ingest', { method: 'POST' });
      const data = await res.json();
      alert(`Ingested ${data.ingested} chunks!`);
    } catch (err) {
      console.error(err);
      alert('Ingestion failed');
    }
  };

  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col h-full border-r border-gray-700">
      <h1 className="text-xl font-bold text-[var(--color-accent)] mb-8">Personal Life OS</h1>

      <button
        onClick={handleIngest}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 transition-colors"
      >
        Sync Google Drive
      </button>

      <button
        onClick={onReviewClick}
        className="w-full bg-[var(--color-accent)] hover:bg-teal-600 text-gray-900 font-bold py-2 px-4 rounded transition-colors"
      >
        Weekly Review
      </button>

      <div className="mt-8">
        <h2 className="text-sm uppercase text-gray-400 font-semibold mb-2">Sources</h2>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>Drive: Q1 OKRs</li>
          <li>Drive: Project Specs</li>
          <li>Drive: Journal</li>
        </ul>
      </div>
    </div>
  );
}
