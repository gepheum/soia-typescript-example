# Soia TypeScript example

Example showing how to use soia's [TypeScript code generator](https://github.com/gepheum/soia-typescript-gen) in a project.

## Build and run the example

```shell
# Download this repository
git clone https://github.com/gepheum/soia-typescript-example.git

cd soia-typescript-example

# Install all dependencies, which include the soia compiler and the soia
# typescript code generator
npm i

# The build step includes both soia codegen and TypeScript to Javascript
# transpilation
npm run build

# Starts an HHTP server on http://localhost:8787/
npm run server
```
