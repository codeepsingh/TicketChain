.PHONY: build test fmt check clippy clean

build:
	cargo build --target wasm32-unknown-unknown --release

test:
	cargo test

fmt:
	cargo fmt -- --check

check:
	cargo check

clippy:
	cargo clippy -- -D warnings

clean:
	cargo clean
