---
"@indxsearch/intrface": minor
---

New `BucketFilterPanel`: groups a numeric field into ranges the user can tick, several at once. Configure it with a bucket `width` (equal-width buckets over the field's range), an array of lower edges, or explicit `buckets` with labels and open ends. Each bucket is a range filter; buckets on one field are ORed and the field gets the same excluded-field facet search as `match="any"`, so the other buckets keep their counts after the first tick. Counts are summed client-side from the facet values, so no server change. `ActiveFiltersPanel` shows one chip per selected bucket, and `SearchState` gains `bucketFilters` with `toggleBucketFilter` / `resetBucketFilter` on the context.
