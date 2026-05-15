# CLI

The CLI lets you inspect and manage cache files without writing code.

```bash
npx llm-cacher --help
```

## Commands

### `stats`

Show total, expired, and active entry counts.

```bash
npx llm-cacher stats
npx llm-cacher stats --storage sqlite --path ./llm-cacher.db
npx llm-cacher stats --storage file   --path ./llm-cacher.json
```

Output:

```
Cache Statistics
================
Storage:  sqlite (./llm-cacher.db)
Entries:  142
Expired:  3 (not yet cleaned up)
Active:   139
```

### `list`

Print the cache keys.

```bash
npx llm-cacher list
npx llm-cacher list --limit 50
npx llm-cacher list --storage file --path ./llm-cacher.json
```

### `clear`

Delete all entries.

```bash
npx llm-cacher clear
npx llm-cacher clear --storage sqlite --path ./my-cache.db
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--storage` | `sqlite` | Storage type: `sqlite` or `file` |
| `--path` | `./llm-cacher.db` / `./llm-cacher.json` | Path to the cache file |
| `--limit` | `20` | Max entries shown by `list` |

