import { useState } from 'react';

interface Item {
  id: number;
  name: string;
}

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/api/items`);
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status}`);
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Items Manager
          </h1>
          <p className="text-gray-600">
            A simple React app to manage items via API
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <button
            onClick={loadItems}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Loading...' : 'Load Items'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Items ({items.length})
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-sm text-gray-500">ID: {item.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Item
          </h2>
          <form className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter item name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              disabled
            >
              Add Item
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Form submission will be wired later
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
