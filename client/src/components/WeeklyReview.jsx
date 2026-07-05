import React, { useState, useEffect } from 'react';

export default function WeeklyReview({ onClose }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/review');
        if (res.ok) {
          const data = await res.json();
          setReview(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReview();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:3001/api/review/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReview(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-12 bg-gray-900 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--color-accent)]">Weekly Review</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
        
        {loading ? (
          <div className="text-gray-400">Loading review...</div>
        ) : review ? (
          <div className="bg-gray-800 rounded-xl p-8 shadow-xl border border-gray-700">
            <div className="text-sm text-gray-400 mb-6 border-b border-gray-700 pb-4">
              Generated: {new Date(review.date).toLocaleDateString()}
            </div>
            <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
              {review.content}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 bg-gray-800 p-8 rounded-xl border border-gray-700 flex flex-col items-center text-center">
            <p className="mb-4">No weekly review available yet. It will be generated automatically every Sunday.</p>
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-lg"
            >
              {generating ? "Generating..." : "Generate Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
