// Price facets spread across 0–200 so rangeBounds resolves to { price: { min: 10, max: 200 } }
// and the histogram has meaningful variance across buckets.
export const FACETS = {
  price: [
    { key: '10',  value: 3  },
    { key: '25',  value: 12 },
    { key: '40',  value: 20 },
    { key: '60',  value: 18 },
    { key: '80',  value: 25 },
    { key: '100', value: 15 },
    { key: '120', value: 10 },
    { key: '150', value: 6  },
    { key: '180', value: 4  },
    { key: '200', value: 2  },
  ],
  category: [
    { key: 'running', value: 30 },
    { key: 'trail',   value: 15 },
  ],
};

export const RECORDS = [
  { documentKey: 1, score: 90 },
  { documentKey: 2, score: 80 },
];

export const DOCUMENTS = [
  { id: 1, title: 'Shoe A', price: 50 },
  { id: 2, title: 'Shoe B', price: 80 },
];

export const SEARCH_RESPONSE = {
  records: RECORDS,
  facets: FACETS,
  truncationIndex: -1,
};
