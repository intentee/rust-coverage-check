# rust-coverage-check

Gate `cargo-llvm-cov` coverage by crate.

## Install

```sh
npm install --save-dev @intentee/rust-coverage-check
```

## Use

Generate an `llvm-cov` JSON report from your Rust workspace, then run the
checker against it.

```sh
cargo llvm-cov clean --workspace
cargo llvm-cov --workspace --no-report
cargo llvm-cov report --json --output-path target/llvm-cov.json
cargo llvm-cov report

npx rust-coverage-check target/llvm-cov.json \
  --workspace-root "$PWD" \
  --gated my_crate \
  --gated another_crate \
  --required-percent 99
```

- `<json-path>` (positional, required) — path to the `cargo llvm-cov` JSON report.
- `--workspace-root <path>` (required) — your Cargo workspace root. Files
  outside this directory are ignored.
- `--gated <crate>` (repeatable, optional) — crate names that must meet the
  required percent. Lines, functions, and regions are all checked.
- `--required-percent <number>` (required when `--gated` is supplied) — minimum
  acceptable coverage in percent (0–100).

With no `--gated` flags the tool only prints the per-crate table and exits 0.
With at least one `--gated` flag it prints the table, then exits 1 if any gated
crate is below the threshold or is missing from the report.

## Makefile integration

```make
.PHONY: coverage
coverage: node_modules
	cargo llvm-cov clean --workspace
	cargo llvm-cov --workspace --no-report
	cargo llvm-cov report --json --output-path target/llvm-cov.json
	cargo llvm-cov report
	npx rust-coverage-check target/llvm-cov.json \
	  --workspace-root $(CURDIR) \
	  --gated my_crate \
	  --required-percent 99
```

## License

MIT.
