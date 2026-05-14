# CLI

The CLI lets you inspect and manage cache files without writing code.

```bash
npx llm-cache --help
```

## Commands

### `stats`

Show total, expired, and active entry counts.

```bash
npx llm-cache stats
npx llm-cache stats --storage sqlite --path ./llm-cache.db
npx llm-cache stats --storage file   --path ./llm-cache.json
```

Output:

```
Cache Statistics
================
Storage:  sqlite (./llm-cache.db)
Entries:  142
Expired:  3 (not yet cleaned up)
Active:   139
```

### `list`

Print the cache keys.

```bash
npx llm-cache list
npx llm-cache list --limit 50
npx llm-cache list --storage file --path ./llm-cache.json
```

### `clear`

Delete all entries.

```bash
npx llm-cache clear
npx llm-cache clear --storage sqlite --path ./my-cache.db
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--storage` | `sqlite` | Storage type: `sqlite` or `file` |
| `--path` | `./llm-cache.db` / `./llm-cache.json` | Path to the cache file |
| `--limit` | `20` | Max entries shown by `list` |
