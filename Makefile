.PHONY: all build test check fmt clippy clean deploy frontend-install frontend-build frontend-test

all: build test

build:
	$(MAKE) -C contracts build

test:
	$(MAKE) -C contracts test

check:
	$(MAKE) -C contracts check

fmt:
	$(MAKE) -C contracts fmt

clippy:
	$(MAKE) -C contracts clippy

clean:
	$(MAKE) -C contracts clean

deploy:
	$(MAKE) -C contracts deploy

frontend-install:
	cd frontend && npm install

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test
