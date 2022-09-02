# Metaplex JavaScript SDK MONOREPO Details

### Building metaplex

`nx run packagename:command`

f.e.
`nx run packages/js-plugin-aws:build`
`nx run packages/js-plugin-nft-storage:build`
`nx run packages/js-plugin-aws:build`

or run all targets
`nx run-many --all --target=build --skip-nx-cache`

`nx run packages/js-plugin-aws:test`
`nx run packages/js-plugin-nft-storage:test`
`nx run packages/js-plugin-aws:test`

run only affected targets

`run nx affected --target=test`
