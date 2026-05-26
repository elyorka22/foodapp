const categories = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗' },
  { id: 'grocery', label: 'Grocery', emoji: '🛒' },
  { id: 'flowers', label: 'Flowers', emoji: '💐' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
];

export function CategoryPills() {
  return (
    <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
      {categories.map((c, i) => (
        <button
          key={c.id}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
            i === 0 ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span>{c.emoji}</span>
          {c.label}
        </button>
      ))}
    </div>
  );
}
