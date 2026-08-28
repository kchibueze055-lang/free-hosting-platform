'use client';

import React, { useState } from 'react';

export default function Home() {
  const [siteName, setSiteName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file || !siteName) {
      setStatus('Please choose a file and enter a project name.');
      return;
    }

    setLoading(true);
    setStatus('Deploying...');

    const data = new FormData();
    data.append('siteName', siteName);
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const text = await res.text();
      let result: { error?: string; filePath?: string } = {};

      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server returned invalid response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(result.error || `Server error (${res.status})`);
      }

      setStatus(`Success! File stored at: ${result.filePath}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatus(`Error: ${err.message}`);
      } else {
        setStatus('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">Static Site Deployer</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Project / Subdomain Name
          </label>
          <input
            type="text"
            value={siteName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSiteName(e.target.value)
            }
            className="w-full border p-2 rounded text-black"
            placeholder="my-cool-site"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Entry File (index.html)
          </label>
          <input
            type="file"
            accept=".html"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 w-full font-medium"
        >
          {loading ? 'Deploying...' : 'Deploy File'}
        </button>
      </form>

      {status && (
        <div className="mt-4 p-3 bg-gray-800 text-white rounded text-sm break-all">
          {status}
        </div>
      )}
    </main>
  );
}