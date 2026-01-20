# Setup Taskfile Action

A fast GitHub Action to install [Taskfile](https://taskfile.dev/) (go-task) CLI in your workflows with built-in caching support.

## Features

- **Fast Setup**: Uses tool caching for instant setup on subsequent runs
- **Cross-Platform**: Supports Linux, macOS, Windows, and FreeBSD
- **Multi-Architecture**: Supports amd64, arm64, arm, and 386 architectures
- **Version Flexibility**: Install specific versions or automatically fetch the latest
- **Zero Configuration**: Works out of the box with sensible defaults

## Usage

### Basic Usage (Latest Version)

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Taskfile
    uses: DiyRex/action-setup-taskfile@v1.0.0

  - name: Run tasks
    run: task --list
```

### Specific Version

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Taskfile
    uses: DiyRex/action-setup-taskfile@v1.0.0
    with:
      version: '3.46.4'

  - name: Run tasks
    run: task build
```

### With Outputs

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Taskfile
    id: taskfile
    uses: DiyRex/action-setup-taskfile@v1.0.0

  - name: Print version
    run: echo "Installed Taskfile v${{ steps.taskfile.outputs.version }}"

  - name: Check cache status
    run: echo "Cache hit: ${{ steps.taskfile.outputs.cache-hit }}"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of Taskfile to install (e.g., `3.46.4`, `v3.46.4`, or `latest`) | No | `latest` |
| `github-token` | GitHub token for API requests (used when fetching latest version) | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The version of Taskfile that was installed |
| `cache-hit` | Whether the Taskfile binary was restored from cache (`true`/`false`) |

## Supported Platforms

| OS | Architectures |
|----|---------------|
| Linux | amd64, arm64, arm, 386 |
| macOS | amd64, arm64 |
| Windows | amd64, arm64, arm, 386 |
| FreeBSD | amd64, arm64, arm, 386 |

## Example Workflows

### CI Pipeline

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Taskfile
        uses: DiyRex/action-setup-taskfile@v1.0.0

      - name: Build
        run: task build

      - name: Test
        run: task test

      - name: Lint
        run: task lint
```

### Matrix Build

```yaml
name: Matrix Build

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Taskfile
        uses: DiyRex/action-setup-taskfile@v1.0.0

      - name: Run tasks
        run: task ci
```

## Performance

This action uses GitHub's tool caching mechanism (`@actions/tool-cache`) for optimal performance:

- **First run**: Downloads and caches the Taskfile binary
- **Subsequent runs**: Restores from cache instantly (typically < 1 second)

The cache is scoped to the runner and persists across workflow runs.

## Security

- Uses official Taskfile releases from [go-task/task](https://github.com/go-task/task)
- Downloads over HTTPS
- GitHub token is only used for API requests to fetch the latest version (to avoid rate limiting)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development

```bash
# Install dependencies
npm install

# Build the action
npm run build
```

## Related

- [Taskfile Documentation](https://taskfile.dev/)
- [go-task/task](https://github.com/go-task/task) - The Taskfile CLI repository
