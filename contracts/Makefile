.PHONY: all build test check fmt clippy clean deploy

all: build test

build:
	cargo build --target wasm32-unknown-unknown --release

test:
	cargo test

check:
	cargo check

fmt:
	cargo fmt --all -- --check

clippy:
	cargo clippy --all-targets -- -D warnings

clean:
	cargo clean

deploy:
	@echo "To deploy contracts, execute the following commands:"
	@echo "stellar contract deploy --wasm target/wasm32-unknown-unknown/release/ticket_manager.wasm --source admin --network testnet"
	@echo "stellar contract deploy --wasm target/wasm32-unknown-unknown/release/ticket_escrow.wasm --source admin --network testnet"
