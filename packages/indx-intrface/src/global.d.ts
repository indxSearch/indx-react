declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Side-effect CSS imports (e.g. `import '@indxsearch/systm/styles.css'`) carry no
// types; declare the module so the .d.ts build (tsc) doesn't error with TS2882.
declare module '*.css';